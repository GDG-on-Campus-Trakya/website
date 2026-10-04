"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageContainer, PageHeader, Section } from "@/components/ui/page";

const WORD_BANKS = {
  tr: [
    "bir", "ve", "bu", "ne", "için", "ile", "olan", "de", "da", "mi", "ben", "sen", "o", "biz", "siz", "onlar", "şu", "gibi", "var", "yok",
    "çok", "daha", "en", "her", "hiç", "nasıl", "neden", "nerede", "kim", "hangi", "şey", "zaman", "yer", "kişi", "gün", "yıl", "ay", "hafta", "saat", "dakika",
    "iyi", "kötü", "büyük", "küçük", "yeni", "eski", "uzun", "kısa", "hızlı", "yavaş", "güzel", "çirkin", "kolay", "zor", "az", "fazla", "önemli", "gereksiz", "doğru", "yanlış",
    "yapmak", "olmak", "etmek", "gelmek", "gitmek", "almak", "vermek", "görmek", "söylemek", "bilmek", "istemek", "sevmek", "anlamak", "düşünmek", "yaşamak", "ölmek", "yemek", "içmek", "uyumak", "kalkmak",
    "ev", "iş", "okul", "araba", "bilgisayar", "telefon", "kitap", "masa", "sandalye", "pencere", "kapı", "su", "yemek", "ekmek", "para", "arkadaş", "aile", "anne", "baba", "çocuk",
  ],
  en: [
    "the", "and", "this", "what", "for", "with", "that", "from", "into", "your", "you", "they", "them", "there", "these", "those", "about", "after", "before", "while",
    "more", "less", "best", "every", "never", "how", "why", "where", "when", "which", "thing", "time", "place", "person", "day", "year", "month", "week", "hour", "minute",
    "good", "bad", "large", "small", "new", "old", "long", "short", "fast", "slow", "beautiful", "ugly", "easy", "hard", "few", "many", "important", "useless", "right", "wrong",
    "make", "become", "do", "come", "go", "take", "give", "see", "say", "know", "want", "love", "understand", "think", "live", "eat", "drink", "sleep", "wake", "learn",
    "home", "work", "school", "car", "computer", "phone", "book", "table", "chair", "window", "door", "water", "bread", "money", "friend", "family", "mother", "father", "child", "community",
  ],
};

const CODE_SNIPPETS = [
  {
    lang: "javascript",
    code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}`,
  },
  {
    lang: "javascript",
    code: `const getData = async (url) => {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n};`,
  },
  {
    lang: "javascript",
    code: `class Rect {\n  constructor(w, h) {\n    this.w = w;\n    this.h = h;\n  }\n  get area() {\n    return this.w * this.h;\n  }\n}`,
  },
  {
    lang: "javascript",
    code: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconst sum = doubled.reduce((a, n) => a + n, 0);`,
  },
  {
    lang: "python",
    code: `def sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]`,
  },
  {
    lang: "python",
    code: `class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None`,
  },
  {
    lang: "java",
    code: `public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  },
  {
    lang: "csharp",
    code: `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
  },
  {
    lang: "cpp",
    code: `#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  },
  {
    lang: "go",
    code: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  },
  {
    lang: "rust",
    code: `fn main() {\n    println!("Hello, World!");\n}`,
  },
  {
    lang: "assembly",
    code: `section .data\n    msg db "Hello, World!", 0xa\nsection .text\n    global _start\n_start:\n    mov eax, 4\n    mov ebx, 1\n    mov ecx, msg\n    mov edx, 13\n    int 0x80\n    mov eax, 1\n    int 0x80`,
  },
  {
    lang: "typescript",
    code: `interface User {\n    name: string;\n    id: number;\n}\nclass UserAccount {\n    name: string;\n    id: number;\n    constructor(name: string, id: number) {\n        this.name = name;\n        this.id = id;\n    }\n}`,
  },
  {
    lang: "ruby",
    code: `class Greeter\n  def initialize(name)\n    @name = name.capitalize\n  end\n  def salute\n    puts "Hello #{@name}!"\n  end\nend`,
  },
  {
    lang: "php",
    code: `<?php\nclass Greeting {\n    public $name;\n    public function __construct($name) {\n        $this->name = $name;\n    }\n    public function sayHello() {\n        echo "Hello, " . $this->name . "!";\n    }\n}\n?>`,
  },
  {
    lang: "swift",
    code: `import Swift\nstruct Greeter {\n    var name: String\n    func greet() {\n        print("Hello, \\(name)!")\n    }\n}\nlet greeter = Greeter(name: "World")\ngreeter.greet()`,
  },
  {
    lang: "kotlin",
    code: `class Greeter(val name: String) {\n    fun greet() {\n        println("Hello, $name!")\n    }\n}\nfun main() {\n    val greeter = Greeter("World")\n    greeter.greet()\n}`,
  },
  {
    lang: "scala",
    code: `object HelloWorld {\n  def main(args: Array[String]): Unit = {\n    println("Hello, world!")\n  }\n}`,
  },
  {
    lang: "perl",
    code: `use strict;\nuse warnings;\nsub greet {\n    my ($name) = @_;\n    print "Hello, $name!\n";\n}\ngreet("World");`,
  },
  {
    lang: "r",
    code: `greet <- function(name) {\n  paste("Hello,", name, "!")\n}\ngreet("World")`,
  },
];

const COPY = {
  tr: {
    title: "Yazma Hızı Testi",
    subtitle: "Yazma hızını ve doğruluğunu ölç",
    normalMode: "Normal Mod",
    codeMode: "Kod Modu",
    reset: "Sıfırla",
    endlessMode: "Sınırsız Mod",
    endlessHelp: "(Yazdıkça yeni metin gelir)",
    wpm: "KDK",
    accuracy: "Doğruluk",
    time: "Süre",
    rawWpm: "Ham KDK",
    wordsPerMinute: "KDK (Kelime/Dk)",
    correctChars: "Doğru Karakter",
    errors: "Hata",
    clickToStart: "Yazmaya başlamak için yukarıdaki metin kutusuna tıklayın",
    results: "Test Sonuçları",
    tryAgain: "Tekrar Dene",
  },
  en: {
    title: "Typing Speed Test",
    subtitle: "Measure your typing speed and accuracy",
    normalMode: "Normal Mode",
    codeMode: "Code Mode",
    reset: "Reset",
    endlessMode: "Endless Mode",
    endlessHelp: "(A new text appears as you keep typing)",
    wpm: "WPM",
    accuracy: "Accuracy",
    time: "Time",
    rawWpm: "Raw WPM",
    wordsPerMinute: "WPM (Words/Min)",
    correctChars: "Correct Characters",
    errors: "Errors",
    clickToStart: "Click the text box above to start typing",
    results: "Test Results",
    tryAgain: "Try Again",
  },
};

export default function TypingTest() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [mode, setMode] = useState("normal");
  const [isEndless, setIsEndless] = useState(false);
  const [text, setText] = useState("");
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const containerRef = useRef(null);

  const generateText = useCallback(() => {
    if (mode === "normal") {
      const wordCount = 100;
      const randomWords = [];
      const bank = WORD_BANKS[locale];
      for (let i = 0; i < wordCount; i += 1) {
        randomWords.push(bank[Math.floor(Math.random() * bank.length)]);
      }
      return randomWords.join(" ");
    }

    const randomSnippet =
      CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    return randomSnippet.code;
  }, [mode, locale]);

  const resetTest = useCallback(() => {
    const newText = generateText();
    setText(newText);
    setInput("");
    setCurrentCharIndex(0);
    setStartTime(null);
    setIsActive(false);
    setStats(null);
    setTimeout(() => containerRef.current?.focus(), 100);
  }, [generateText]);

  useEffect(() => {
    resetTest();
  }, [mode, locale, resetTest]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const finishTest = (finalInput, currentText, currentStartTime) => {
    const endTime = Date.now();
    setIsActive(false);

    const timeElapsed = (endTime - currentStartTime) / 1000 / 60;
    const wordsTyped = finalInput.trim().split(/\s+/).length;
    const charsTyped = finalInput.length;

    let correctChars = 0;
    for (let i = 0; i < Math.min(finalInput.length, currentText.length); i += 1) {
      if (finalInput[i] === currentText[i]) correctChars += 1;
    }
    const accuracy = Math.round((correctChars / currentText.length) * 100);
    const wpm = Math.round(wordsTyped / timeElapsed);
    const rawWpm = Math.round(charsTyped / 5 / timeElapsed);

    setStats({
      wpm,
      rawWpm,
      accuracy,
      correctChars,
      totalChars: currentText.length,
      timeElapsed: Math.round(timeElapsed * 60),
    });
  };

  const handleInput = (char) => {
    setInput((prev) => {
      const newInput = prev + char;
      setCurrentCharIndex(newInput.length);

      if (newInput.length >= text.length) {
        if (isEndless) {
          const newText = generateText();
          setText(newText);
          setTimeout(() => {
            setInput("");
            setCurrentCharIndex(0);
          }, 0);
          return newInput;
        }

        finishTest(newInput, text, startTime);
      }
      return newInput;
    });
  };

  const handleKeyDown = (event) => {
    if (stats) return;

    if (!startTime && !isActive) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    if (event.key === "Tab") {
      event.preventDefault();

      if (mode === "code") {
        handleInput("    ");
      } else {
        setInput((prev) => {
          setCurrentCharIndex((current) => {
            let skipTo = current;
            while (
              skipTo < text.length &&
              (text[skipTo] === " " || text[skipTo] === "\t")
            ) {
              skipTo += 1;
            }
            if (skipTo > current) {
              const skippedText = text.substring(current, skipTo);
              const newInput = prev + skippedText;
              setInput(newInput);
              setCurrentCharIndex(newInput.length);
              return newInput.length;
            }
            return current;
          });
          return prev;
        });
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      setInput((prev) => {
        setCurrentCharIndex((current) => {
          let skipTo = current;
          while (skipTo < text.length && text[skipTo] !== "\n") {
            skipTo += 1;
          }
          if (skipTo < text.length && text[skipTo] === "\n") {
            skipTo += 1;
          }
          if (skipTo > current) {
            const skippedText = text.substring(current, skipTo);
            const newInput = prev + skippedText;
            setInput(newInput);
            setCurrentCharIndex(newInput.length);
            return newInput.length;
          }
          return current;
        });
        return prev;
      });
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      setInput((prev) => {
        if (prev.length > 0) {
          const newInput = prev.slice(0, -1);
          setCurrentCharIndex(newInput.length);
          return newInput;
        }
        return prev;
      });
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      handleInput(event.key);
    }
  };

  // Characters are grouped into unbreakable words with real spaces between them,
  // so lines wrap between words instead of in the middle of one.
  const renderedText = useMemo(() => {
    const nodes = [];
    let word = [];

    const flushWord = (key) => {
      if (word.length === 0) return;
      nodes.push(
        <span key={`w${key}`} className="whitespace-nowrap">
          {word}
        </span>
      );
      word = [];
    };

    text.split("").forEach((char, index) => {
      let className = "";

      if (index < input.length) {
        if (input[index] === char) {
          className = "text-success";
        } else {
          className = "text-error underline";
        }
      } else if (index === input.length) {
        className = "bg-warning text-ink";
      } else {
        className = "text-muted-foreground";
      }

      const span = (
        <span key={index} className={className}>
          {char}
          {char === "\n" ? <br /> : null}
        </span>
      );

      if (char === " " || char === "\n") {
        flushWord(index);
        nodes.push(span);
      } else {
        word.push(span);
      }
    });

    flushWord("end");
    return nodes;
  }, [text, input]);

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.subtitle} />

      {!stats ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant={mode === "normal" ? "default" : "outline"}
                onClick={() => setMode("normal")}
                disabled={isActive}
              >
                {copy.normalMode}
              </Button>
              <Button
                variant={mode === "code" ? "default" : "outline"}
                onClick={() => setMode("code")}
                disabled={isActive}
              >
                {copy.codeMode}
              </Button>
            </div>

            <Button variant="secondary" onClick={resetTest}>
              {copy.reset}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <label
              htmlFor="typing-endless"
              className="flex cursor-pointer items-center gap-2"
            >
              <Checkbox
                id="typing-endless"
                checked={isEndless}
                onCheckedChange={(checked) => setIsEndless(checked === true)}
                disabled={isActive}
              />
              <span className="font-medium">{copy.endlessMode}</span>
            </label>
            <span className="text-sm text-muted-foreground">{copy.endlessHelp}</span>
          </div>

          {isActive && (
            <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-rule py-4">
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-muted-foreground">{copy.wpm}</dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums leading-none">
                  {Math.round(
                    input.trim().split(/\s+/).length /
                      ((Date.now() - startTime) / 1000 / 60) || 0
                  )}
                </dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-muted-foreground">{copy.accuracy}</dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums leading-none">
                  {Math.round(
                    (input
                      .split("")
                      .filter((char, i) => char === text[i]).length /
                      currentCharIndex) *
                      100 || 0
                  )}
                  %
                </dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-muted-foreground">{copy.time}</dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums leading-none">
                  {Math.round((Date.now() - startTime) / 1000)}s
                </dd>
              </div>
            </dl>
          )}

          <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="mt-6 cursor-text overflow-hidden rounded-lg border border-input bg-background p-5 focus-visible:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:p-8"
          >
            <div
              className={`leading-relaxed ${
                mode === "code"
                  ? "overflow-x-auto whitespace-pre-wrap font-mono text-base md:text-lg"
                  : "break-words font-sans text-xl md:text-2xl"
              }`}
              style={{ userSelect: "none", wordBreak: "break-word" }}
            >
              {renderedText}
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{copy.clickToStart}</p>
        </div>
      ) : (
        <Section title={copy.results}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-rule pb-8 md:grid-cols-3">
            <div className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{copy.wordsPerMinute}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none md:text-5xl">
                {stats.wpm}
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{copy.accuracy}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none md:text-5xl">
                {stats.accuracy}%
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{copy.rawWpm}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none md:text-5xl">
                {stats.rawWpm}
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{copy.time}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none md:text-5xl">
                {stats.timeElapsed}s
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{copy.correctChars}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none text-success md:text-5xl">
                {stats.correctChars}
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{copy.errors}</dt>
              <dd className="font-display text-4xl font-extrabold tabular-nums leading-none text-error md:text-5xl">
                {stats.totalChars - stats.correctChars}
              </dd>
            </div>
          </dl>

          <Button size="lg" onClick={resetTest} className="mt-8">
            {copy.tryAgain}
          </Button>
        </Section>
      )}
    </PageContainer>
  );
}
