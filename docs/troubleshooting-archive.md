# Troubleshooting Archive & Dependency Resolutions

This document archives the critical resolution details for package and compilation bugs encountered during previous development sprints.

---

## 1. Vite Development/Build Memory Crash (Windows x64)

### Symptoms
During `npm run build` or `npm run dev` in the React dashboard, the build process crashed with the following signature:
`Error: Invalid access to memory location. (code: ERR_DLOPEN_FAILED)`

### Root Cause
The project was originally bootstrapped with `"vite": "^8.0.12"` (referencing the new Rust-based `rolldown` bundler). On Windows environments, loading the precompiled native binding `rolldown-binding.win32-x64-msvc.node` failed due to memory mapping conflicts in specific Node.js runtimes.

### Resolution
Downgraded Vite and React plugin dependencies in [apps/dashboard/package.json](file:///e:/Autonomous/files/message-service/apps/dashboard/package.json):
* Downgraded `vite` from `^8.0.12` to `^5.4.11`
* Downgraded `@vitejs/plugin-react` from `^4.3.3` (which was forcing newer bundler dependencies)
This restored compilation stability by reverting to the tested, stable Rollup/Babel pipeline.

---

## 2. Hoisted NestJS Packages Dynamic Resolution Failures

### Symptoms
When starting the NestJS api locally, the application crashed on startup with:
`ERROR [PackageLoader] The "class-validator" package is missing. Please, make sure to install it to take advantage of ValidationPipe.`

### Root Cause
The root-level workspace configuration was hoisting `@nestjs/common` and core modules to the monorepo root `node_modules`. However, `class-validator` and `class-transformer` were only defined inside the nested workspace `apps/backend/package.json`. The hoisted `@nestjs/common` package loader tried resolving `class-validator` relative to the root node_modules and failed to see it.

### Resolution
Installed `class-validator` and `class-transformer` directly at the **monorepo root** workspace level:
```json
"dependencies": {
  "class-transformer": "0.5.1",
  "class-validator": "0.15.1"
}
```
This hoists these modules into the root `node_modules`, making them globally visible to the backend loaders.

---

## 3. Metro Bundler Module Resolution conflicts (React Native Monorepo)

### Symptoms
* Bundler fails with: `Unable to resolve module @babel/runtime/helpers/interopRequireDefault`
* App runtime crash: `Invalid hook call. Hooks can only be called inside the body of a function component.`

### Root Cause
1. **Missing watch folders**: By default, React Native’s Metro bundler only watches the local workspace `apps/mobile/`. When dependencies are hoisted to the root directory, Metro fails to locate them.
2. **Duplicate React instances**: NPM workspaces hoist dependencies, creating a duplicate instance of React at the root directory while one remains in the local `apps/mobile/node_modules/react`. When React Native resolves multiple instances, it invalidates the global hooks dispatcher.

### Resolution
Modified [apps/mobile/metro.config.js](file:///e:/Autonomous/files/message-service/apps/mobile/metro.config.js):
1. Configured `watchFolders` to include the root directory.
2. Added root node_modules to `nodeModulesPaths`.
3. Intercepted module requests in `resolveRequest` to redirect all queries for `react` and `react-native` back to the root `node_modules` exclusively:
```javascript
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    resolveRequest: (context, moduleName, platform) => {
      // Redirect React resolution to root to avoid duplicate instances
      if (moduleName === 'react' || moduleName === 'react-native') {
        return context.resolveRequest(
          context,
          path.resolve(workspaceRoot, 'node_modules', moduleName),
          platform
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    }
  }
};
```
