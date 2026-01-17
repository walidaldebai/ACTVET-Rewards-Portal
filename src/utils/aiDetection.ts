export const detectAI = (text: string) => {
    const aiPatterns = ["as an ai", "as a language model", "furthermore", "moreover", "in conclusion", "it is important to note"];
    return aiPatterns.some(p => text.toLowerCase().includes(p));
};
