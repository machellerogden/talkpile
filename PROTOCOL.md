# Protocol Specification

JSON-based protocol for interacting with a Node.js-hosted REPL server.

The protocol defines message formats, operations, and error handling mechanisms to facilitate communication between clients and the REPL server.

## Message Format

Messages exchanged between the client and the server are in JSON format. Each message consists of a JSON object with the following fields:

- op (operation): A string indicating the type of operation to be performed.
    - Possible values: `eval`, `complete`, `describe`.
- payload: An object containing the data relevant to the operation.
- meta: An optional object containing metadata about the message.

## Security Considerations

Authentication, authorization, and encryption tbd.
