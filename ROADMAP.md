# Talkpile Roadmap

Talkpile is set of tools for hosting your own "always available" team of personalized AI-driven agents.

- [x] The terminal interface is a simple chat client that can be used to interact with the agents.
- [ ] The web interface is a more advanced chat client that can be used to interact with the agents.

## TODO

- [ ] Backfill tests
- [ ] JSON-RPC + WebSockets
- [ ] Web Interface
- [ ] ai provider abstraction
    - providers to implement:
        - [x] openai
        - [x] ollama
        - [x] anthropic
        - [ ] gcp
        - [ ] azure
        - [ ] aws
- [ ] Unify effects and tools
- [ ] vector store based memory
- [ ] wake word, transcription, tts

## PoCs

- [ ] Interbot Communication
    - Use 2 with-effects effect generators to orchestrate 2 agents communicating with each other.
    - Use 2 with-effects effect generators to orchestrate 2 agents communicating with each other, but with a human in the loop.
- [ ] Integration with [trajectory](https://npmjs.com/package/trajectory)
    - Specialist agent instructed to draft state machine definitions and then run them via trajectory.
