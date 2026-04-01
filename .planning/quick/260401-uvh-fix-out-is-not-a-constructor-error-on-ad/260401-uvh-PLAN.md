---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/resolver.js
autonomous: true
requirements: [FIX-ESM-INTEROP]
must_haves:
  truths:
    - "Admin config page loads without 'out is not a constructor' error"
    - "Resolver functions (getConfigStatus, setFluxSecret, etc.) work correctly"
  artifacts:
    - path: "src/resolver.js"
      provides: "Forge resolver with correct CJS/ESM interop"
      contains: "ResolverModule.default || ResolverModule"
  key_links:
    - from: "src/resolver.js"
      to: "@forge/resolver"
      via: "ESM default import with CJS fallback"
      pattern: "\\.default \\|\\|"
---

<objective>
Fix "out is not a constructor" error on admin config page caused by CJS/ESM interop issue with `@forge/resolver`.

Purpose: Unblock Atlassian Marketplace QA review by fixing the admin page.
Output: Working resolver.js with correct import pattern.
</objective>

<execution_context>
@/Users/boxcee/workspaces/forge-flux-deployments/.claude/get-shit-done/workflows/execute-plan.md
@/Users/boxcee/workspaces/forge-flux-deployments/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/resolver.js
@src/__tests__/resolver.test.js
@CLAUDE.md (see "Forge Tunnel & Deploy Gotchas" section for the exact pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix @forge/resolver CJS/ESM interop in resolver.js</name>
  <files>src/resolver.js</files>
  <action>
    Replace line 1 of src/resolver.js:
    
    FROM: `import Resolver from '@forge/resolver';`
    TO:   `import ResolverModule from '@forge/resolver';`
    
    Add after the import line:
    `const Resolver = ResolverModule.default || ResolverModule;`
    
    This is the exact pattern documented in CLAUDE.md under "Forge Tunnel & Deploy Gotchas".
    The `@forge/resolver` package exports CJS. In Node ESM, `import X from 'cjs-pkg'` gives a
    namespace object, not the constructor. The `.default || module` pattern handles both
    Forge's bundler (which resolves it correctly) and raw Node.js (which wraps it in a namespace).
    
    The rest of the file remains unchanged — `new Resolver()` on line 12 will now receive
    the actual constructor.
  </action>
  <verify>
    <automated>npm test -- --testPathPattern=resolver</automated>
  </verify>
  <done>All resolver tests pass. The import uses the CJS/ESM interop pattern.</done>
</task>

</tasks>

<verification>
- `npm test` passes (all test suites, not just resolver)
- `npm run lint` passes
</verification>

<success_criteria>
- src/resolver.js uses `ResolverModule.default || ResolverModule` pattern
- All existing tests pass without modification (test already mocks with `{ default: MockResolver }`)
- No lint errors
</success_criteria>

<output>
After completion, create `.planning/quick/260401-uvh-fix-out-is-not-a-constructor-error-on-ad/260401-uvh-SUMMARY.md`
</output>
