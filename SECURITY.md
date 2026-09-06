# Northstar CAPA security boundary

When CAPA runs inside Northstar, the application remains on its own origin and communicates with the Northstar host through a constrained `postMessage` bridge.

- The CAPA application never reads or receives a Northstar bearer token or service-role credential.
- Embedded messages are accepted only from approved Northstar host origins.
- Tenant and user context is supplied by the host after server-side validation.
- Northstar performs authenticated record ingestion on behalf of the embedded CAPA application.
- Direct API mode remains available only as an explicit standalone integration option; embedded Northstar sessions force Host Bridge mode.
- Repository automation is read-only validation. It does not push generated changes directly to `main`.
