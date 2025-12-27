function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeWithMap(text: string) {
  let normalized = "";
  const map: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const n = normalize(text[i]!);
    for (let j = 0; j < n.length; j++) {
      normalized += n[j];
      map.push(i);
    }
  }

  return { normalized, map };
}

function extractSection(
  originalText: string,
  start: string,
  ends: string[]
): string | null {
  const { normalized, map } = normalizeWithMap(originalText);

  const startIndex = normalized.indexOf(normalize(start));
  if (startIndex === -1) return null;

  const afterStartIndex = startIndex + normalize(start).length;

  let endIndex = normalized.length;
  for (const end of ends) {
    const i = normalized.indexOf(normalize(end), afterStartIndex);
    if (i !== -1 && i < endIndex) {
      endIndex = i;
    }
  }

  const originalStart = map[afterStartIndex];
  const originalEnd = map[endIndex - 1]! + 1;

  return originalText.slice(originalStart, originalEnd).trim();
}

export function parseEcoReport(text: string) {
  const diagnosticos_y_comentarios = extractSection(
    text,
    "DIAGNOSTICOS Y COMENTARIOS",
    ["RESUMEN DE HALLAZGOS", "PLAN"]
  );

  const resumen_hallazgos = extractSection(text, "RESUMEN DE HALLAZGOS", [
    "COMENTARIOS",
    "DIAGNOSTICOS",
    "PLAN",
  ]);

  const diagnosticos =
    extractSection(text, "DIAGNOSTICOS", ["COMENTARIOS", "PLAN"]) ||
    extractSection(text, "DIAGNOSTICO", ["COMENTARIOS", "PLAN"]);

  const comentarios = extractSection(text, "COMENTARIOS", ["PLAN"]);

  const conclusiones =
    extractSection(text, "CONCLUSIONES", ["PLAN"]) ||
    extractSection(text, "CONCLUSION", ["PLAN"]);
  const hallazgos = extractSection(text, "HALLAZGOS", ["PLAN"]);

  const encontrado_diagnostico = extractSection(
    text,
    "Encontrando lo siguientes diagnósticos",
    ["COMENTARIOS", "PLAN"]
  );

  if (encontrado_diagnostico) {
    return {
      resultado: `DIAGNOSTICOS:\n${encontrado_diagnostico}`,
      tipo: "diagnosticos",
    };
  }

  if (hallazgos && conclusiones) {
    return {
      resultado: `HALLAZGOS:\n${hallazgos}\n\nCONCLUSIONES:\n${conclusiones}`,
      tipo: "hallazgos_conclusiones",
    };
  }

  if (conclusiones) {
    return {
      resultado: `CONCLUSIONES:\n${conclusiones}`,
      tipo: "conclusiones",
    };
  }

  if (diagnosticos_y_comentarios) {
    return {
      resultado: `DIAGNOSTICOS Y COMENTARIOS:\n${diagnosticos_y_comentarios}`,
      tipo: "diagnosticos_y_comentarios",
    };
  }

  if (resumen_hallazgos && comentarios) {
    return {
      resultado: `RESUMEN DE HALLAZGOS:\n${resumen_hallazgos}\n\nCOMENTARIOS:\n${comentarios}`,
      tipo: "resumen_hallazgos_comentarios",
    };
  }

  if (resumen_hallazgos) {
    return {
      resultado: `RESUMEN DE HALLAZGOS:\n${resumen_hallazgos}`,
      tipo: "resumen_hallazgos",
    };
  }

  if (diagnosticos && comentarios) {
    return {
      resultado: `DIAGNOSTICOS:\n${diagnosticos}\n\nCOMENTARIOS:\n${comentarios}`,
      tipo: "diagnosticos_comentarios",
    };
  }

  if (diagnosticos) {
    return {
      resultado: `DIAGNOSTICOS:\n${diagnosticos}`,
      tipo: "diagnosticos",
    };
  }

  if (comentarios) {
    return {
      resultado: `COMENTARIOS:\n${comentarios}`,
      tipo: "comentarios",
    };
  }
}
