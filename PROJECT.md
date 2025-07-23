# cubic Coding Challenge

We’re excited that you’re considering joining our founding engineering team. This short project is designed to let you **show off what makes you great**—your speed, craft, product instincts, and intelligent use of AI tools. It is intentionally open-ended so that you can lean into your strengths while still producing something we can run and evaluate end-to-end.

---

## **1. Challenge overview**

### Goal

Build an automatic **Wiki Generator** for a public GitHub repository we’ll provide. Think “one-click developer docs” that a real engineering team would want to read.

### Time window

You may start as soon as you’re reading this. You have **48 hours total**. We recommend candidates spend **≈ 5 focused hours**; but it’s up to you on how long you spend.

### Freedom of tech

Use any language, framework, or service you like. To keep AI simple, use OpenAI and the key we give you (see below).

---

## **2. What to build**

1. **Repository analyser**
   - Programmatically identify high-level subsystems, balancing both feature-driven and technical perspectives—such as key features, user services, authentication flows, data layers, CLI tools, or core architectural components.
   - Produce a machine-readable structure (JSON, DB, even a plain object) that the wiki layer can consume.
2. **Wiki generator**
   - Create human-readable pages for each subsystem.
   - Include a concise description, public interfaces or entry points, and **inline citations** that link back to the specific lines or files in the repo.
   - Architecture diagrams are easy to generate with AI, and also encouraged!
   - Provide simple navigation (sidebar, search, table-of-contents—up to you).
3. **Deployment**
   - Give us a publicly reachable URL (Vercel, Netlify, Fly.io, GitHub Pages, etc.).
   - We should be able to click and explore with zero local setup.
4. **Code quality & commit history**
   - Write idiomatic, lint-clean code you’re proud of. Use of AI is encouraged, but submit code that you’re proud of—just like if you were writing this feature for real production.
   - Use commits to narrate your thinking; perfection not required, clarity appreciated.

---

## **3. Bonus features (optional)**

Feel free to use your own creative sense of how to build more on top of this!

- **Chat interface** that answers questions about both the wiki and the underlying code (RAG, custom embeddings, etc.).
- **Semantic search** across the docs.
- **Live update hook** that regenerates docs when new commits land.
- **Insight dashboards** such as test-coverage heat-maps or dependency graphs.

---

## **4. How we evaluate**

We score holistically across five dimensions. We will of course take into account that this is just a weekend project:

- **End-to-end working demo** – Does it run and feel coherent?
- **Technical correctness** – Sensible architecture, error handling.
- **Craft & readability** – Craft and polish of the UI. Clear naming, tidy repo layout, no dead code.
- **Smart AI leverage** – Efficient use of LLMs/embeddings with guard-rails against hallucinations or cost blow-ups.
- **Product thinking** – Would real engineers actually find these docs useful?

### We’ll be looking at a variety of types of repos, some examples below

- <https://github.com/Textualize/rich-cli>
- <https://github.com/browser-use/browser-use>
- <https://github.com/tastejs/todomvc>
