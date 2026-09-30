import * as vscode from 'vscode';
import { BannerSettings, BannerStyle } from './renderer';

const SECTION = 'blockBanner';

export function loadSettings(): BannerSettings {
  const c = vscode.workspace.getConfiguration(SECTION);
  return {
    font: c.get<string>('font', ''),
    rows: c.get<number>('rows', 10),
    style: c.get<BannerStyle>('style', 'shadow'),
    depth: c.get<number>('depth', 2),
  };
}

export async function saveSettings(s: BannerSettings): Promise<void> {
  const c = vscode.workspace.getConfiguration(SECTION);
  const target = vscode.ConfigurationTarget.Global;
  await Promise.all([
    c.update('font', s.font, target),
    c.update('rows', s.rows, target),
    c.update('style', s.style, target),
    c.update('depth', s.depth, target),
  ]);
}
