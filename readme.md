#SarahJS
---

A reactive Javascript Framework for the masses.

### Loading Chronology

1. In index.html, requirejs is loaded and the index.js is parsed.
1. index.js loads SarahJS [/lib/SarahJS/sarah.js], the core framework file.
1. SarahJS loads all plugins defined. The plugins are located under [/lib/SarahJS/plugins]
1. SarahJS loads the app.js [/app/app.js]
1. SarahJS loads all modules defined in [/app/ModuleName/ModuleName.js]
1. SarahJS fires up the default route.

**Documentation is on it's way. In the mean time, please view files inside the app/ directory to get a taste of SarahJS**
