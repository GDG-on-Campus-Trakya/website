import 'server-only';
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth, getFirestore, getStorageBucket, verifyIdToken } from '@/utils/firebaseAdmin';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Like Firebase's own requires-recent-login rule: an account can be deleted only within a few
// minutes of signing in, so a session left open on a shared computer cannot delete it. The
// client re-authenticates first when needed, before anything is deleted.
const RECENT_LOGIN_SECONDS = 5 * 60;
const BATCH_LIMIT = 400;

/** Storage object path of a Firebase Storage download URL, or null. */
function storagePathOf(url) {
  if (typeof url !== 'string' || !url.includes('firebasestorage.googleapis.com')) return null;
  try {
    const match = new URL(url).pathname.match(/\/o\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function commitInChunks(db, operations) {
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    operations.slice(i, i + BATCH_LIMIT).forEach((apply) => apply(batch));
    await batch.commit();
  }
}

/**
 * Deletes everything the delete dialog lists: profile and photo, registrations and QR codes,
 * posts with their photos and comments, the user's comments and likes, support requests with
 * attachments and reopen logs, and the stored cookie consent. Then the sign-in account itself.
 * Data goes first, so a failure leaves an account that can simply try again.
 */
async function deleteUserData(db, bucket, uid, email) {
  const deletes = [];
  const updates = [];
  const files = new Set();
  const addFile = (path) => path && files.add(path);

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    const data = userSnap.data();
    addFile(data.imagePath);
    addFile(storagePathOf(data.photoURL));
    deletes.push(userRef);
  }

  const registrations = await db.collection('registrations').where('userId', '==', uid).get();
  registrations.forEach((entry) => {
    deletes.push(entry.ref);
    const { qrCodeId } = entry.data();
    if (qrCodeId) deletes.push(db.collection('qrCodes').doc(qrCodeId));
  });

  const posts = await db.collection('posts').where('userId', '==', uid).get();
  const ownPostIds = new Set(posts.docs.map((entry) => entry.id));
  for (const post of posts.docs) {
    deletes.push(post.ref);
    addFile(storagePathOf(post.data().imageUrl));
    const commentsOnPost = await db.collection('comments').where('postId', '==', post.id).get();
    commentsOnPost.forEach((comment) => deletes.push(comment.ref));
  }

  // Comments on other people's posts: remove them and keep those posts' counters right.
  const comments = await db.collection('comments').where('userId', '==', uid).get();
  const commentCounts = new Map();
  comments.forEach((comment) => {
    const { postId } = comment.data();
    if (ownPostIds.has(postId)) return; // already deleted with the post
    deletes.push(comment.ref);
    if (postId) commentCounts.set(postId, (commentCounts.get(postId) || 0) + 1);
  });
  if (commentCounts.size > 0) {
    const postSnaps = await db.getAll(
      ...[...commentCounts.keys()].map((id) => db.collection('posts').doc(id))
    );
    postSnaps
      .filter((snap) => snap.exists)
      .forEach((snap) => {
        const count = commentCounts.get(snap.id);
        updates.push((batch) =>
          batch.update(snap.ref, { commentCount: FieldValue.increment(-count) })
        );
      });
  }

  // Likes live on the posts as an array of user ids.
  const liked = await db.collection('posts').where('likes', 'array-contains', uid).get();
  liked.forEach((post) => {
    if (ownPostIds.has(post.id)) return;
    updates.push((batch) =>
      batch.update(post.ref, {
        likes: FieldValue.arrayRemove(uid),
        likeCount: FieldValue.increment(-1),
      })
    );
  });

  if (email) {
    const tickets = await db.collection('tickets').where('userEmail', '==', email).get();
    tickets.forEach((ticket) => {
      deletes.push(ticket.ref);
      (ticket.data().attachments || []).forEach((attachment) =>
        addFile(attachment?.path || storagePathOf(attachment?.url))
      );
    });

    const reopens = await db.collection('ticketReopens').where('userEmail', '==', email).get();
    reopens.forEach((entry) => deletes.push(entry.ref));

    deletes.push(db.collection('userConsents').doc(email));
  }

  // Updates first: they touch documents that must still exist.
  await commitInChunks(db, updates);
  await commitInChunks(
    db,
    deletes.map((ref) => (batch) => batch.delete(ref))
  );

  // Files last and best effort: a leftover file is not worth failing the deletion for.
  if (bucket) {
    await Promise.all(
      [...files].map((path) =>
        bucket
          .file(path)
          .delete()
          .catch((error) => logger.warn('Could not delete stored file:', path, error.code || error.message))
      )
    );
  }
}

export async function DELETE(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await verifyIdToken(authHeader.slice('Bearer '.length));
  } catch (error) {
    logger.warn('Delete account: invalid token', error.code || error.message);
    return NextResponse.json({ code: 'unauthorized' }, { status: 401 });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!decoded.auth_time || nowSeconds - decoded.auth_time > RECENT_LOGIN_SECONDS) {
    return NextResponse.json({ code: 'requires-recent-login' }, { status: 403 });
  }

  const db = getFirestore();
  const auth = getAuth();
  if (!db || !auth) {
    return NextResponse.json({ code: 'server-error' }, { status: 500 });
  }

  try {
    await deleteUserData(db, getStorageBucket(), decoded.uid, decoded.email);
    await auth.deleteUser(decoded.uid).catch((error) => {
      // A retry after the account itself was already removed
      if (error.code !== 'auth/user-not-found') throw error;
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting account:', error);
    return NextResponse.json({ code: 'server-error' }, { status: 500 });
  }
}
