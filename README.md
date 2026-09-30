# Block Banner Generator

Big block-letter banner comments, in any language. An IntelliJ Platform plugin.

```
 ███████████╗
 ████╔══█████╗
 ████║  ╚████║  ████████╗  ██████████╗  ██████████╗   ████████╗   ███████╗
 ██████████╔═╝ ███╔══████╗ ████╔══████╗ ████╔══████╗ ████╔══███╗  ████╔══╝
 ████████████╗ ╚█████████║ ████║  ████║ ████║  ╚███║ ███████████╗ ███╔╝
 ████╔════███║ █████╔████║ ████║  ████║ ████║   ███║ ███╔═══════╝ ███║
 ████████████║ ███╔═█████║ ████║  ████║ ████║   ███║ ████╗ ████╗  ███║
 ██████████╔═╝ ╚█████╔███║ ████║  ████║ ████║   ███║ ╚═███████╔╝  ███║
 ╚═════════╝    ╚════╝╚══╝ ╚═══╝  ╚═══╝ ╚═══╝   ╚══╝   ╚══════╝   ╚══╝

         ██╗██╗            ██╗
 ██╗ ██╗███║██║  ██╗       ██║
 ██████║███║██║  ██║   ██████║
 ██████║██████║  ██║   ██████║
 ██╔═██║███╔██║  ██║   ╚═══██║
 ██████║███║██║  ████████╗ ██║
 ╚═════╝███║██║  ╚═══════╝ ██║
        ╚██║██║            ██║
         ╚═╝╚═╝            ╚═╝
```

FIGlet tools ship one hand-drawn glyph per letter, so they stop at the Latin alphabet.
This plugin draws your text with a font installed on your machine and turns the pixels into block characters.
English, Korean, Japanese, Chinese, symbols, mixed: if your font can draw it, it becomes a banner. Works offline.

## Install

`Settings → Plugins → Marketplace`, search **Block Banner Generator**. IntelliJ 2025.1 or newer.

## Usage

| | Windows / Linux | macOS |
|---|---|---|
| Quick Block Banner | `Alt+Shift+B` | `⌥⇧B` |
| Block Banner... | right-click, or `Code → Generate` | same |

- **Quick**: select text, press the shortcut. The lines are replaced with a banner using your last settings.
- **Dialog**: right-click the selection, *Block Banner...*. Pick font, height and style with a live preview.
- Nothing selected: the dialog opens and the banner goes above the caret line.
- The comment prefix (`//`, `#`, `--`, `<!-- -->`) follows the file's language. Shortcut is editable in `Settings → Keymap`.

## Styles

Shadow

```
 ████████╗
 ████╔═████╗
 ████║ ╚████╗
 ██████████████╗
 ████╔═════████║
 ████║     ████║
 ╚═══╝     ╚═══╝
```

3D

```
    ████
   ██████▒     ████
   ██▒▒███▒▒ ████████
  ████████▒▒▒████████▒▒
 ██████████▒▒██▒▒▒███▒▒▒▒
████▒▒▒▒▒███▒████████▒▒▒▒
 ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
   ▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒▒▒▒▒
```

Shade

```
    #@@@:
   =@%#@#     -+++=:
  :@@-.%@=   +#*==%@#
 .%@%==*@@:  =*#**%@@
 #@@++++#@# -@@:  #@@
-@@=    .@@+.*%@%*%@@
```

## Build

```bash
./gradlew test buildPlugin   # build/distributions/*.zip
./gradlew runIde             # sandbox IDE
```

JDK 21. The first build downloads IntelliJ IDEA Community 2025.1.

## License

MIT

---

## 한국어

몇 단어를 큼직한 블록 글자 배너 주석으로 바꿔 주는 IntelliJ 플러그인입니다.
figlet 처럼 글자마다 그려 둔 조각을 쓰지 않고 PC 에 설치된 폰트로 글자를 직접 그려서 블록 문자로 바꿉니다.
그래서 영어, 한글, 일본어, 중국어, 기호 전부 됩니다. 오프라인입니다.

- **설치**: `Settings → Plugins → Marketplace` 에서 "Block Banner Generator" 검색. IntelliJ 2025.1 이상.
- **빠른 실행**: 텍스트를 드래그하고 `Alt+Shift+B` (macOS `⌥⇧B`). 마지막 설정으로 선택 줄이 바로 배너가 됩니다.
- **다이얼로그**: 드래그 후 우클릭 → *Block Banner...*. 폰트, 높이, 스타일을 미리보기로 고릅니다.
- 선택이 없으면 다이얼로그가 열리고 커서 줄 위에 삽입됩니다.
- 주석 기호(`//`, `#`, `--`, `<!-- -->`)는 파일 언어를 따르고, 단축키는 `Settings → Keymap` 에서 바꿀 수 있습니다.
