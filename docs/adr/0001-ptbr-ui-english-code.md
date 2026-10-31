# Portuguese (pt-BR) UI, English code and docs

The app is played by Brazilian Portuguese speakers, so every user-facing string is pt-BR. Code, comments and Markdown docs stay in English and use the terms in `GLOSSARY.md`, so a Player's "Ganhei" button is still a **Win** in the code. All UI copy lives in a single strings module rather than inline in markup or scripts. This keeps the glossary-to-label mapping in one place and leaves room for another locale later without retrofitting.
