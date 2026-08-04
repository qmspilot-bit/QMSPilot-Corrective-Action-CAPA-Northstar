# Controlled Work Instructions & Workforce Readiness

Design-partner MVP for QMSPilot Northstar.

## Purpose

Connect controlled SOPs and work instructions directly to role-based training, practical competency verification, and authorization to perform work independently.

## Included in this MVP

- Executive readiness dashboard
- Controlled document library
- Visual work-instruction builder
- Approval and revision-impact workflow
- Role-based training assignments
- Practical competency signoff
- Workforce readiness matrix
- Simplified QR-oriented shop-floor view
- Sandbox interactions and local draft persistence

## Control model

`Create -> Approve -> Release -> Train -> Verify -> Authorize`

The workspace distinguishes four levels:

1. Awareness
2. Understanding
3. Demonstrated competency
4. Authorized for independent work

## Current implementation status

This first version is a self-contained browser prototype located at `workforce-readiness/index.html`. It intentionally uses sandbox data and browser-local draft storage so the design-partner workflow can be validated before Supabase tables, authentication, storage, and tenant routing are connected.

## Production hardening sequence

1. Connect tenant, site, department, work-center, role, and user context.
2. Move controlled records and status history to Supabase.
3. Store evidence and released files in private Supabase Storage.
4. Add role-based permissions and electronic approval controls.
5. Generate training assignments from approved revision-impact decisions.
6. Add immutable audit events and notification routing.
7. Add QR deep links that resolve only the current active revision.
8. Validate the workflow with the Portacool design-partner use case before expanding scope.
