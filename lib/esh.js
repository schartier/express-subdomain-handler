/**
 * SubdomainHandler
 *
 * This runs on all routes and manipulates the req.url to include the tag
 * as the first parameter (/:tag/foo/bar). This then triggers different route listeners.
 * It is important because it transforms the fragile subdomain mesh tag into a more
 * tageable route parameter that is easily retrievable in later route middleware.
 *
 * USAGE:
 *
 *		// add express-subdomain-handler to your express middleware stack
 *		app.use( require('express-subdomain-handler')({ baseUrl: 'example.com', prefix: 'myprefix', logger: true }) );
 *
 *		// setup routes to catch subdomain urls
 *		// eg. 'http://mysubdomain.example.com/homepage'
 *		app.get('/myprefix/:thesubdomain/thepage', function(req, res, next){
 *
 *			// for the example url this will print 'mysubdomain'
 *			res.send(req.params.thesubdomain);
 *
 *		});
 */


function _escapeRegExp(str) {
    return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


/**
 * Creates the custom regex object from the specified baseUrl
 *
 * @param  {string} baseUrl [description]
 * @return {Object} the regex object
 */
function subdomainRegex(baseUrl){
    var regex;

    baseUrl = _escapeRegExp(baseUrl);

    regex = new RegExp('((?!www)\\b[-\\w\\.]+)\\.' + baseUrl + '(?::)?(?:\d+)?');

    return regex;
}



module.exports = function(options){

    // prefix default
    options.prefix = options.prefix ? '/' + options.prefix : '';

    // logger default
    options.logger = (options.logger === true) ? true : false;


    var regex = subdomainRegex(options.baseUrl);

    // the returned function
    return function(req, res, next){
        var i,
            subdomainString = regex.exec(req.headers.host);

        // return error if no baseUrl was specified
        if(!options.baseUrl)
            return next("express-subdomain-handler: You haven't specified a baseUrl, this is required!");

        if(options.logger)
            console.log("\nESH: Rewriting all subdomain routes to /%s/[subdomain1]/[subdomain2]/path/after/baseurl for baseUrl %s \n", options.prefix, options.baseUrl);

        // if there is no subdomain, return
        if(!subdomainString)
            return next();

        // create an array of subdomains
        var subdomainArray = subdomainString[1].split('.'),
            i = subdomainArray.length;

        while(i--){
            req.url = '/' + subdomainArray[i] + req.url;
        }

        req.url = options.prefix + req.url;
        req.subdomains = subdomainArray;

        // if logging is turned on
        if(options.logger) console.log('ESH: %s => %s', req.originalUrl, req.url);

        // jump to next middleware in stack
        next();
    };
};
