/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SmartFile, Folder, SearchResult, WorkspaceType } from "../types";

// Helper for simple Levenshtein distance (typo tolerance check)
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 1; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// Check if string contains or is very close to another
export function fuzzyMatch(target: string, query: string): { matches: boolean; score: number } {
  const t = target.toLowerCase().trim();
  const q = query.toLowerCase().trim();

  if (!q) return { matches: true, score: 1.0 };
  if (!t) return { matches: false, score: 0 };

  // Exact match gets top score
  if (t === q) return { matches: true, score: 2.0 };

  // Substring index match
  const index = t.indexOf(q);
  if (index !== -1) {
    // Score based on how early it matches and general length ratio
    const score = 1.0 + (1.0 - index / t.length) * 0.5;
    return { matches: true, score };
  }

  // Typo tolerance for short words (if query is at least 3 letters)
  if (q.length >= 3) {
    const distance = getLevenshteinDistance(t, q);
    // If distance is very small relative to query size
    if (distance <= Math.floor(q.length / 3)) {
      const score = 0.8 - distance / q.length;
      return { matches: true, score };
    }
  }

  // Token word matching (multi-word match)
  const qTokens = q.split(/\s+/);
  const tTokens = t.split(/\s+/);
  let matchedTokens = 0;
  qTokens.forEach(qt => {
    if (tTokens.some(tt => tt.includes(qt))) {
      matchedTokens++;
    }
  });

  if (matchedTokens > 0 && matchedTokens === qTokens.length) {
    return { matches: true, score: 0.9 };
  }

  return { matches: false, score: 0 };
}

// Core search coordinator
export function searchWorkspace(
  query: string,
  files: SmartFile[],
  folders: Folder[]
): SearchResult[] {
  if (!query) return [];

  const results: { result: SearchResult; score: number }[] = [];

  // Helper to build folders breadcrumb path e.g. "Vault/Research"
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return "Root";
    const pathSegments: string[] = [];
    let currentId: string | null = folderId;
    let safeguard = 0; // Prevent infinite cycles

    while (currentId && safeguard < 10) {
      const folder = folders.find(f => f.id === currentId);
      if (folder) {
        pathSegments.unshift(folder.name);
        currentId = folder.parentId;
      } else {
        break;
      }
      safeguard++;
    }

    return pathSegments.join("/");
  };

  files.forEach(file => {
    const parentPath = getFolderPath(file.folderId);

    // 1. Match File Name
    const nameMatch = fuzzyMatch(file.name, query);
    if (nameMatch.matches) {
      results.push({
        score: nameMatch.score * 3.0, // High weight on titles
        result: {
          fileId: file.id,
          fileName: file.name,
          fileType: file.type,
          path: parentPath,
          matchType: "title",
          matchSnippet: `File: ${file.name} (${file.type.toUpperCase()})`,
        },
      });
    }

    // 2. Match File Tags
    file.tags.forEach(tag => {
      const tagMatch = fuzzyMatch(tag, query);
      if (tagMatch.matches) {
        results.push({
          score: tagMatch.score * 2.0,
          result: {
            fileId: file.id,
            fileName: file.name,
            fileType: file.type,
            path: parentPath,
            matchType: "tag",
            matchSnippet: `Matched Tag: #${tag}`,
          },
        });
      }
    });

    // 3. Search Spreadsheet-specific Cells
    if (file.type === WorkspaceType.SPREADSHEET && file.sheets) {
      file.sheets.forEach(sheet => {
        Object.entries(sheet.cells).forEach(([address, cell]) => {
          // Check cell values
          const cellValMatch = fuzzyMatch(cell.value, query);
          if (cellValMatch.matches && cell.value) {
            results.push({
              score: cellValMatch.score * 1.5,
              result: {
                fileId: file.id,
                fileName: file.name,
                fileType: file.type,
                path: `${parentPath} > ${sheet.name}`,
                matchType: "content",
                matchSnippet: `Cell [${address}] value: "${cell.value}"${cell.lockLevel > 0 ? " (LOCKED)" : ""}`,
                targetAddress: address,
              },
            });
          }

          // Check cell formulas
          if (cell.formula) {
            const cellFormulaMatch = fuzzyMatch(cell.formula, query);
            if (cellFormulaMatch.matches) {
              results.push({
                score: cellFormulaMatch.score * 1.8,
                result: {
                  fileId: file.id,
                  fileName: file.name,
                  fileType: file.type,
                  path: `${parentPath} > ${sheet.name}`,
                  matchType: "formula",
                  matchSnippet: `Cell [${address}] formula: ${cell.formula}`,
                  targetAddress: address,
                },
              });
            }
          }

          // Check Comments/Notes
          if (cell.note) {
            const noteMatch = fuzzyMatch(cell.note, query);
            if (noteMatch.matches) {
              results.push({
                score: noteMatch.score * 1.2,
                result: {
                  fileId: file.id,
                  fileName: file.name,
                  fileType: file.type,
                  path: `${parentPath} > ${sheet.name}`,
                  matchType: "comment",
                  matchSnippet: `Cell [${address}] note: "${cell.note}"`,
                  targetAddress: address,
                },
              });
            }
          }
        });
      });
    }

    // 4. Search Document blocks
    if (file.type === WorkspaceType.DOCUMENT && file.docBlocks) {
      file.docBlocks.forEach(block => {
        const blockMatch = fuzzyMatch(block.content, query);
        if (blockMatch.matches && block.content) {
          results.push({
            score: blockMatch.score * 1.4,
            result: {
              fileId: file.id,
              fileName: file.name,
              fileType: file.type,
              path: parentPath,
              matchType: "content",
              matchSnippet: `Doc fragment: "${block.content.slice(0, 80)}${block.content.length > 80 ? "..." : ""}"`,
            },
          });
        }
      });
    }

    // 5. Search Hybrid Blocks
    if (file.type === WorkspaceType.HYBRID && file.hybridBlocks) {
      file.hybridBlocks.forEach((block, idx) => {
        const titleMatch = fuzzyMatch(block.title, query);
        if (titleMatch.matches) {
          results.push({
            score: titleMatch.score * 1.3,
            result: {
              fileId: file.id,
              fileName: file.name,
              fileType: file.type,
              path: parentPath,
              matchType: "content",
              matchSnippet: `Hybrid Block [${idx + 1}]: "${block.title}"`,
            },
          });
        }

        if (block.docContent) {
          const contentMatch = fuzzyMatch(block.docContent, query);
          if (contentMatch.matches) {
            results.push({
              score: contentMatch.score * 1.1,
              result: {
                fileId: file.id,
                fileName: file.name,
                fileType: file.type,
                path: parentPath,
                matchType: "content",
                matchSnippet: `Hybrid snippet: "${block.docContent.slice(0, 80)}"`,
              },
            });
          }
        }
      });
    }
  });

  // Sort by match score descending
  return results
    .sort((a, b) => b.score - a.score)
    .map(r => r.result)
    // De-duplicate results matching the same file with the exact same snippet/coordinate
    .filter((v, i, self) => 
      self.findIndex(t => 
        t.fileId === v.fileId && 
        t.matchSnippet === v.matchSnippet && 
        t.targetAddress === v.targetAddress
      ) === i
    )
    .slice(0, 15); // Return top 15 results
}
