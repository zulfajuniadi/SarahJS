#SarahJS

A reactive Javascript Framework for the masses.

What it is:

1. Reactive by design. Changes to template data are rendered automatically.
1. Pluggable. Mostly mutable functions. Using [RequireJS](http://), you can easily override core functionality and have it your way.
1. Modular. Keep your modules apart from the other modules. This promotes better code reuse and less 'messy' directory structure.
1. Super simple API. DRY as a desert.

Whats it going to be:

1. A full back-end and front-end framework that marries serverside-technology (Currently PHP and NodeJS is shortlisted) with front-end awesomeness.
1. Fully documented - Soon =)
1. Fully Unit Tested - Sooner.

### Loading Chronology

1. In index.html, requirejs is loaded and the index.js is parsed.
1. index.js loads SarahJS [/lib/SarahJS/sarah.js], the core framework file.
1. SarahJS loads all plugins defined. The plugins are located under [/lib/SarahJS/plugins]
1. SarahJS loads the app.js [/app/app.js]
1. SarahJS loads all modules defined in [/app/ModuleName/ModuleName.js]
1. SarahJS fires up the default route.

**Documentation is on it's way. In the mean time, please view files inside the app/ directory to get a taste of SarahJS**
