import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from "../firebase";
import { storage } from "../lib/firebase/storage";
import { logger } from "./logger";

/**
 * Create a new dataset
 * @param {Object} datasetData - Dataset information
 * @returns {Promise<string>} Dataset ID
 */
export const createDataset = async (datasetData) => {
  try {
    const datasetsRef = collection(db, "pollDatasets");
    const docRef = await addDoc(datasetsRef, {
      ...datasetData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  } catch (error) {
    logger.error("Error creating dataset:", error);
    throw error;
  }
};

/**
 * Upload image to Firebase Storage
 * @param {File} file - Image file
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<string>} Image URL
 */
export const uploadDatasetImage = async (file, datasetId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `poll-datasets/${datasetId}/${fileName}`);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return url;
  } catch (error) {
    logger.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Get all datasets
 * @returns {Promise<Array>} Array of datasets
 */
export const getAllDatasets = async () => {
  try {
    const datasetsRef = collection(db, "pollDatasets");
    const snapshot = await getDocs(datasetsRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error("Error fetching datasets:", error);
    throw error;
  }
};

/**
 * Update dataset
 * @param {string} datasetId - Dataset ID
 * @param {Object} updates - Fields to update
 */
export const updateDataset = async (datasetId, updates) => {
  try {
    const datasetRef = doc(db, "pollDatasets", datasetId);
    await updateDoc(datasetRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    logger.error("Error updating dataset:", error);
    throw error;
  }
};

/**
 * Delete dataset
 * @param {string} datasetId - Dataset ID
 */
export const deleteDataset = async (datasetId) => {
  try {
    const datasetRef = doc(db, "pollDatasets", datasetId);
    await deleteDoc(datasetRef);

    // Note: Images in storage won't be auto-deleted
    // You may want to implement cleanup logic
  } catch (error) {
    logger.error("Error deleting dataset:", error);
    throw error;
  }
};

/**
 * Add item to dataset
 * @param {string} datasetId - Dataset ID
 * @param {Object} item - Item to add
 */
export const addItemToDataset = async (datasetId, item) => {
  try {
    const datasetRef = doc(db, "pollDatasets", datasetId);
    const datasetDoc = await getDocs(datasetRef);
    const currentItems = datasetDoc.data().items || [];

    await updateDoc(datasetRef, {
      items: [...currentItems, item],
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    logger.error("Error adding item to dataset:", error);
    throw error;
  }
};

/**
 * Remove item from dataset
 * @param {string} datasetId - Dataset ID
 * @param {string} itemId - Item ID to remove
 */
export const removeItemFromDataset = async (datasetId, itemId) => {
  try {
    const datasetRef = doc(db, "pollDatasets", datasetId);
    const datasetDoc = await getDocs(datasetRef);
    const currentItems = datasetDoc.data().items || [];

    const updatedItems = currentItems.filter(item => item.id !== itemId);

    await updateDoc(datasetRef, {
      items: updatedItems,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    logger.error("Error removing item from dataset:", error);
    throw error;
  }
};
