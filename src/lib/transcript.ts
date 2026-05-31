function findSentences(text: string, terms: string[]) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences
    .filter((sentence) => terms.some((term) => sentence.toLowerCase().includes(term)))
    .slice(0, 4)
    .join("\n");
}

export function extractTranscriptInsights(transcript?: string | null) {
  if (!transcript) {
    return {
      summary: "",
      customerNotes: "",
      nextActions: "",
    };
  }

  const summary = transcript
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);

  const painPoints = findSentences(transcript, ["problem", "challenge", "issue", "struggle", "risk", "delay", "manual"]);
  const objections = findSentences(transcript, ["concern", "expensive", "price", "budget", "approve", "approval", "not sure"]);
  const budgetSignals = findSentences(transcript, ["budget", "deposit", "invoice", "po", "payment", "quote", "proposal", "subscription"]);
  const decisionSignals = findSentences(transcript, ["decision", "manager", "director", "finance", "procurement", "owner", "committee"]);
  const nextActions = findSentences(transcript, ["next", "send", "follow", "book", "schedule", "demo", "proposal", "invoice", "call"]);

  const customerNotes = [
    painPoints ? `Pain points:\n${painPoints}` : "",
    objections ? `Objections or risks:\n${objections}` : "",
    budgetSignals ? `Budget/payment signals:\n${budgetSignals}` : "",
    decisionSignals ? `Decision-maker signals:\n${decisionSignals}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    summary,
    customerNotes,
    nextActions,
  };
}
