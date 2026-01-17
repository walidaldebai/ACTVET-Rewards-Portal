import React, { useState, useEffect } from 'react';
import { Clock, FileText, ShieldCheck, ChevronRight } from 'lucide-react';
import { detectAI } from '../utils/aiDetection';

interface InnovatorQuizProps {
    studentId: string;
    attempts: number;
    onComplete: (pts: number) => void;
}

const InnovatorQuiz: React.FC<InnovatorQuizProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [timer, setTimer] = useState(60);
    const [score, setScore] = useState(0);
    const [startTime] = useState(Date.now());
    const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);

    const questionPool = [
        { q: "What is your primary goal as an ATS Innovator?", difficulty: "Entry", time: 45, keywords: ["impact", "community", "growth", "excellence", "efficiency"] },
        { q: "Propose a sustainable initiative for the campus.", difficulty: "Medium", time: 90, keywords: ["green", "recycle", "solar", "energy", "sustainability", "waste"] },
        { q: "Explain how technology can enhance institutional excellence.", difficulty: "Advanced", time: 120, keywords: ["automation", "data", "digital", "optimization", "security", "ai"] },
        { q: "How would you improve student engagement using digital tools?", difficulty: "Medium", time: 90, keywords: ["interactive", "collaboration", "gamification", "feedback", "platform"] },
        { q: "Describe a process you would automate to save time on campus.", difficulty: "Advanced", time: 120, keywords: ["registration", "scheduling", "workflow", "efficiency", "system"] }
    ];

    useEffect(() => {
        // Pick 3 random questions from the pool
        const shuffled = [...questionPool].sort(() => 0.5 - Math.random()).slice(0, 3);
        setShuffledQuestions(shuffled);
        setTimer(shuffled[0].time);
    }, []);

    useEffect(() => {
        if (shuffledQuestions.length > 0) {
            const t = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
            return () => clearInterval(t);
        }
    }, [step, shuffledQuestions]);

    const calculateAnswerScore = (text: string, question: any) => {
        const trimmed = text.trim();
        const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
        const charCount = trimmed.length;
        
        if (charCount < 10) return 0;
        if (detectAI(trimmed)) return 0;

        // Base points for length and word count
        let points = 0;
        
        // Length factor (max 500)
        points += Math.min(500, charCount * 2);
        
        // Word count factor (max 500)
        points += Math.min(500, wordCount * 10);

        // Quality check (Keyword matching)
        let qualityMatch = 0;
        question.keywords?.forEach((kw: string) => {
            if (trimmed.toLowerCase().includes(kw)) qualityMatch++;
        });

        const qualityBonus = qualityMatch * 200; // 200 pts per relevant keyword
        points += qualityBonus;

        return points;
    };

    const handleNext = () => {
        const text = (answers[step] || "").trim();
        if (text.length < 15) {
            alert("Please provide a more detailed response (at least 15 characters) to demonstrate your innovative thinking.");
            return;
        }

        const qScore = calculateAnswerScore(text, shuffledQuestions[step]);
        
        if (qScore === 0 && detectAI(text)) {
            alert("⚠️ AI Detection Triggered or insufficient quality. Score for this section: 0.");
        }

        const newScore = score + qScore;
        if (step < shuffledQuestions.length - 1) {
            setStep(step + 1);
            setTimer(shuffledQuestions[step + 1].time);
            setScore(newScore);
        } else {
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            const speedBonus = Math.max(0, 500 - timeTaken);
            onComplete(newScore + speedBonus);
        }
    };

    if (shuffledQuestions.length === 0) return null;

    return (
        <div className="quiz-card-v2 animate-slide-up">
            <div className="quiz-progress-bar">
                <div className="progress-fill gold-gradient" style={{ width: `${((step + 1) / shuffledQuestions.length) * 100}%` }}></div>
            </div>

            <div className="quiz-header">
                <div className="quiz-meta">
                    <span className="quiz-step">CHALLENGE {step + 1} OF {shuffledQuestions.length}</span>
                    <span className={`quiz-diff-badge ${shuffledQuestions[step].difficulty.toLowerCase()}`}>
                        {shuffledQuestions[step].difficulty}
                    </span>
                </div>
                <div className={`quiz-timer-v3 ${timer < 10 ? 'urgent' : ''}`}>
                    <Clock size={18} />
                    <span>{timer}s</span>
                </div>
            </div>

            <div className="quiz-body-v2">
                <h2 className="quiz-q-text">{shuffledQuestions[step].q}</h2>

                <div className="quiz-input-area-v2">
                    <label className="input-label">
                        <FileText size={16} />
                        <span>ORIGINAL INNOVATION PROPOSAL</span>
                    </label>
                    <textarea
                        className="quiz-textarea-v2"
                        placeholder="Structure your thoughts here... Demonstrate critical thinking and institutional value."
                        value={answers[step] || ""}
                        onChange={e => {
                            const newAns = [...answers];
                            newAns[step] = e.target.value;
                            setAnswers(newAns);
                        }}
                    />
                    <div className="quiz-footer-meta">
                        <div className="ai-shield">
                            <ShieldCheck size={14} className="text-green" />
                            <span>ATS ANTI-AI SECURITY ACTIVE</span>
                        </div>
                        <div className="char-count">
                            {answers[step]?.length || 0} characters | { (answers[step] || "").trim().split(/\s+/).filter(w => w.length > 0).length } words
                        </div>
                    </div>
                </div>
            </div>

            <div className="quiz-actions-v2">
                <button className="quiz-next-btn-v2 accent-gradient" onClick={handleNext}>
                    <span>{step === shuffledQuestions.length - 1 ? "FINALIZE ASSESSMENT" : "SUBMIT CHALLENGE"}</span>
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default InnovatorQuiz;
