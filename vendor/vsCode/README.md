# Block Banner Generator

Big block-letter banner comments, in any language. A VS Code extension.

```
//  ███████╗  ██╗         ██╗██╗
//  ████████████║ ██████████║██║
//  ╚═══████████║ ╚══██╔══██║██║
//  █████╔═█████║    ██║████║██║
//  ████████████║   ████╔═██║██║
//  ╚═██████████║ ███╔═█████║██║
//    ██████████║ ╚══╝ ╚══██║██║
//    ███████████╗        ██║██║
//    ╚══════════╝        ╚═╝╚═╝
```

FIGlet tools ship one hand-drawn glyph per letter, so they stop at the Latin alphabet.
This extension draws your text with a font installed on your machine and turns the pixels into block characters.
English, Korean, Japanese, Chinese, symbols, mixed: if your font can draw it, it becomes a banner. Works offline.

## Usage

| | Windows / Linux | macOS |
|---|---|---|
| Quick Block Banner | `Ctrl+Shift+Alt+B` | `⌘⇧⌥B` |
| Block Banner... | right-click | right-click |

The shortcut differs from the IntelliJ plugin because `Shift+Alt+B` is taken by the Java extension and `Ctrl+Alt+B` by VS Code itself. Rebind it in *Keyboard Shortcuts* if you like.

- **Quick**: select text, press the shortcut. The lines are replaced with a banner using your last settings.
- **Dialog**: right-click the selection, *Block Banner...*. Pick font, height and style with a live preview.
- Nothing selected: the dialog opens and the banner goes above the caret line.
- The comment prefix (`//`, `#`, `--`, `<!-- -->`) follows the file's language.

## Settings

| Setting | Default | |
|---|---|---|
| `blockBanner.font` | `""` | Font family. Characters it lacks (Korean, Japanese, Chinese) are drawn with an installed font for that script. |
| `blockBanner.rows` | `10` | Banner height in lines. |
| `blockBanner.style` | `shadow` | `shadow`, `3d`, `shade`. |
| `blockBanner.depth` | `2` | Extrusion depth for `3d`. |

The dialog saves what you picked, so Quick uses it next time.

## Build

```bash
npm install
npm test               # unit tests, renders real fonts
npm run package:all    # vsix/*.vsix, one per platform
```

The text is rasterized with `@napi-rs/canvas`, a native module, so the extension ships one VSIX per platform.
`package:all` builds the bundle once, then installs each platform's binary into a staging folder and packages it, so all nine VSIXs come out of one machine.

## License

MIT

---

## 한국어

몇 단어를 큼직한 블록 글자 배너 주석으로 바꿔 주는 VS Code 확장입니다.
figlet 처럼 글자마다 그려 둔 조각을 쓰지 않고 PC 에 설치된 폰트로 글자를 직접 그려서 블록 문자로 바꿉니다.
그래서 영어, 한글, 일본어, 중국어, 기호 전부 됩니다. 오프라인입니다.

- **빠른 실행**: 텍스트를 드래그하고 `Ctrl+Shift+Alt+B` (macOS `⌘⇧⌥B`). 마지막 설정으로 선택 줄이 바로 배너가 됩니다. `Shift+Alt+B` 는 Java 확장이, `Ctrl+Alt+B` 는 VS Code 가 쓰고 있어서 IntelliJ 판과 다릅니다.
- **다이얼로그**: 드래그 후 우클릭 → *Block Banner...*. 폰트, 높이, 스타일을 미리보기로 고릅니다.
- 선택이 없으면 다이얼로그가 열리고 커서 줄 위에 삽입됩니다.
- 주석 기호(`//`, `#`, `--`, `<!-- -->`)는 파일 언어를 따릅니다.
- 고른 폰트에 없는 글자(한글·가나·한자)는 그 문자권의 설치 폰트로 자동으로 채웁니다.
