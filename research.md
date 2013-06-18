REST, hypermedia
================
 
* Basics
    * <https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm>
        * <https://www.ics.uci.edu/~fielding/pubs/dissertation/fielding_dissertation.pdf>
    * <http://proquest.safaribooksonline.com/book/-/9781449309497>

* In RDF
    * <http://restdesc.org> / <http://restdesc.org/about/descriptions>
    * <http://www.markus-lanthaler.com/hydra/spec/latest/core/>
    * <http://www.w3.org/community/hydra/>
    * <https://github.com/fusepool/fusepool-ecs/blob/master/ontologies/src/main/resources/eu/fusepool/ecs/ontologies/ecs.ttl>
    * <https://en.wikipedia.org/wiki/Link_relation>
    * <http://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven>
    * <http://lists.w3.org/Archives/Public/public-ldp/2013Mar/0045.html>
    * <http://ws-rest.org/2012/proc/a4-2-lanthaler.pdf>
    * <https://static.googleusercontent.com/external_content/untrusted_dlcp/research.google.com/en//pubs/archive/37427.pdf>
    * <http://www.w3.org/TR/void/> (eventuell via /.well-known)
    * <http://folk.uio.no/kjekje/2012/> 

* In JSON
    * <http://stateless.co/hal_specification.html>
    * <http://json-schema.org/>
    * <https://github.com/fidian/hapier>

    * <https://github.com/Graphity/graphity-ldp/wiki/Linked-Data-server-specification>

* Implementation
    * <https://en.wikipedia.org/wiki/Atom_%28standard%29>
    * <https://tools.ietf.org/html/rfc6690>

* Books
    * <http://proquest.safaribooksonline.com/9781449309497>
    * <http://proquest.safaribooksonline.com/book/web-development/web-services/9781449383312?bookview=toc>
        * <https://github.com/mamund/Building-Hypermedia-APIs>

RDF
===

* Specs
    * <http://www.w3.org/TR/rdf-interfaces/>
    * <http://www.w3.org/TR/rdf-api/>
    * <http://www.w3.org/TR/rdfa-api/>
* JS APIs
    * <https://github.com/antoniogarrote/rdfstore-js>
        * RDF Store in JS (in Memory & MongoDB backend)
        * SPARQL Interface
        * RDF Interfaces API
    * <https://github.com/webr3/rdf-interfaces>
        * RDF Interfaces API
    * <https://github.com/webr3/rdf.js>
        * RDF-API Replacement Vorschlag
    * <https://github.com/webr3/js3>
        * Sehr JS nahe RDF-JS-Objekt API
    * <https://github.com/Acubed/js3>
        * Fork von js3, wohl etwas bessere Node-Integration (gibt ein npm modul)
    * <https://github.com/Acubed/node-rdf>
        * Fork & wohl etwas Weiterentwicklung von RDF.js
    * <https://github.com/RubenVerborgh/node-n3>
    * <https://github.com/Acubed/sparql-spin-js3>
        * SPIN/js3 Interface
    * <http://spinrdf.org/>
        * SPIN Specs
* Interface Libraries
    * <http://antoniogarrote.github.com/semantic-ko/>
        * Vom rdfstore Typ
    * <http://viejs.org/>
        * Relativ neu, EU FP7 Projekt
    * <http://www.w3.org/2005/04/fresnel-info/>
        * Die Mutter aller Ansätze
        * (so gut wie nicht implementiert)

    * <http://uispin.org/>
        * Auf SPIN aufbauend

    * <http://alangrafu.github.com/lodspeakr/>
        * Der Typ der es macht ist noch cool, Ansatz gefällt mir weniger

    * <http://callimachusproject.org>
        * Macht mehr als nur UIs, aber macht das auch
* Uduvudu
    * Schema: <http://vocab.netlabs.org/recipe#>
* Hints from luggen
    * <https://github.com/michael/data>
    * <https://github.com/joshsh/jig>

Buildprocess
============

* <http://blog.millermedeiros.com/node-js-as-a-build-script/>
* <http://gruntjs.com/>
