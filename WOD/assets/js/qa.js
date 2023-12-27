// Toggle filter dropdown visibility on search box click
document.getElementById('searchBox').addEventListener('click', function () {
    document.getElementById('filterDropdown').style.display = 'block';
});

// Close filter dropdown when clicking outside the search box
document.addEventListener('click', function (event) {
    if (!event.target.closest('#searchBox')) {
        document.getElementById('filterDropdown').style.display = 'none';
    }
});

// Function to handle filter selection
function filterQuestions(category) {
    // Perform filter logic based on the selected category
    // Update the resultContainer with the filtered results
    // Example:
    console.log(`Filtering questions by category: ${category}`);

    // Set the selected category to the search input
    document.querySelector('.s-input').value = category;

    // Call the function to fetch and display answers based on SPARQL queries
    askQuestion(category);
}

// Update filter dropdown options as the user types
document.querySelector('.s-input').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const dropdown = document.getElementById('filterDropdown');

    // Clear existing options
    dropdown.innerHTML = '';

    // Add filtered options based on the entered letters
    const filterOptions = ['Quelle est la capitale de l’Algérie ?', 'personnes nées à Berlin', 'Category 2']; // Add more options as needed
    filterOptions.forEach(option => {
        const lowerOption = option.toLowerCase();
        if (lowerOption.includes(query)) {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = option;
            link.onclick = function () {
                filterQuestions(lowerOption);
                // Hide the dropdown after selecting an option
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(link);
        }
    });
});

// Fonction pour formuler une requête SPARQL basée sur la question donnée
function formulateSPARQLQuery(question) {
var sparqlQuery;

if (question.includes("capitale") && question.includes("Algérie")) {

sparqlQuery = `
    PREFIX dbo: <http://dbpedia.org/ontology/>
    SELECT ?capital
    WHERE {
        <http://dbpedia.org/resource/Algeria> dbo:capital ?capital.
    }
`;
} else if (question.includes("personnes nées à Berlin") || (question.includes("Berlin") && question.includes("naissance"))) {
sparqlQuery = `
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dbr: <http://dbpedia.org/resource/>
    
    SELECT ?person ?name ?birthdate
    WHERE {
        ?person rdf:type foaf:Person.
        ?person foaf:name ?name.
        ?person dbo:birthPlace dbr:Berlin.
        ?person dbo:birthDate ?birthdate.
    }
    LIMIT 10
`;
} 
else if (question.includes("Liste des pays et de leur population")) {
    sparqlQuery = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        SELECT ?country ?countryLabel ?population
        WHERE {
            ?country a dbo:Country;
                     rdfs:label ?countryLabel;
                     dbo:populationTotal ?population.
            FILTER(LANG(?countryLabel) = 'fr')  # Ajout de cette ligne pour filtrer par la langue française
        }
        ORDER BY DESC(?population)
        LIMIT 10
    `;
} else if (question.includes("Liste des acteurs et actrices nés après 1980")) {
        sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?person ?name ?birthPlace ?birthDate
            WHERE {
                ?person a dbo:Actor;
                        foaf:name ?name;
                        dbo:birthDate ?birthDate.
                OPTIONAL { ?person dbo:birthPlace ?birthPlace. }
                FILTER (?birthDate > "1980-01-01"^^xsd:date)
            }
            LIMIT 10
        `;
     }  else if (question.includes("Liste des écrivains et de leurs œuvres")) {
        sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?writer ?name ?work ?birthDate
            WHERE {
                { 
                    ?writer a dbo:Writer;
                              foaf:name ?name;
                              dbo:birthDate ?birthDate.
                    ?work dbo:author ?writer. 
                }
                UNION
                { 
                    ?writer a dbo:Writer;
                              foaf:name ?name;
                              dbo:birthDate ?birthDate.
                    FILTER (?birthDate < "1800-01-01"^^xsd:date || ?birthDate > "1950-01-01"^^xsd:date)
                    ?work dbo:author ?writer. 
                }
            }
            LIMIT 10
        `;
    }  else if (question.includes("nombre d'acteurs par nationalité")) {
        sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            SELECT ?nationality (COUNT(?actor) as ?count)
            WHERE {
                ?actor a dbo:Actor;
                          dbo:nationality ?nationality.
            }
            GROUP BY ?nationality
            ORDER BY DESC(?count)
            LIMIT 10
        `;
    } else if (question.includes("artistes musicaux et leurs genres")) {
        sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?artist ?name ?genre
            WHERE {
                ?artist a dbo:MusicalArtist;
                          foaf:name ?name;
                          dbo:genre ?genre.
            }
            ORDER BY ?name
            LIMIT 10
        `;
    }  else if (question.includes("Nombre de personnes nées avant 1980")) {
        sparqlQuery = `
            PREFIX dbo: <http://dbpedia.org/ontology/>
            SELECT ?profession (COUNT(?person) as ?count)
            WHERE {
                { 
                    ?person a dbo:Writer;
                                dbo:birthDate ?birthDate.
                    FILTER (?birthDate < "1980-01-01"^^xsd:date)
                    BIND("Writer" as ?profession) 
                }
                UNION
                { 
                    ?person a dbo:Actor;
                                dbo:birthDate ?birthDate.
                    FILTER (?birthDate < "1980-01-01"^^xsd:date)
                    BIND("Actor" as ?profession) 
                }
            }
            GROUP BY ?profession
            ORDER BY DESC(?count)
            LIMIT 10
        `;
    }
else {
sparqlQuery = "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10";
}

return sparqlQuery;
}


// Fonction pour envoyer la requête SPARQL à DBpedia
function sendSPARQLQuery(query) {
    var dbpediaEndpoint = "http://dbpedia.org/sparql";
    var format = "application/json"; // Vous pouvez également utiliser d'autres formats comme "text/xml"

    fetch(dbpediaEndpoint + "?query=" + encodeURIComponent(query) + "&format=" + format)
        .then(response => response.json())
        .then(data => processSPARQLResult(data))
        .catch(error => console.error("Error:", error));
}

 

// ...

// ...

// Fonction pour traiter les résultats de la requête SPARQL
function processSPARQLResult(result) {
    var bindings = result.results.bindings;

    if (bindings.length > 0) {
        // Display the answer on the page
        var answerDiv = document.getElementById("resultContainer");
        var answerHTML = "<h2></h2><ul>";

        for (var i = 0; i < bindings.length; i++) {
            answerHTML += "<li>";

            for (var key in bindings[i]) {
                if (bindings[i].hasOwnProperty(key)) {
                    var value = bindings[i][key].value;
                    // Extract the text part of the value (remove the URI part)
                    var textValue = value.substring(value.lastIndexOf('/') + 1);
                    answerHTML += `${key}: ${textValue}, `;
                }
            }

            answerHTML = answerHTML.slice(0, -2); // Remove the trailing comma and space
            answerHTML += "</li>";
        }

        answerHTML += "</ul>";
        answerDiv.innerHTML = answerHTML;

        // If you still want to redirect to answer.html, you can modify this part
        var answerText = encodeURIComponent(answerHTML);
        window.location.href = `answer.html?answer=${answerText}`;
    } else {
        var answerDiv = document.getElementById("resultContainer");
        answerDiv.innerHTML = "<h2>No answer found.</h2>";
    }
}

// ...



// Fonction appelée pour poser une question
function askQuestion(question) {
    var sparqlQuery = formulateSPARQLQuery(question);
    sendSPARQLQuery(sparqlQuery);
}
// Function to parse the answer parameter from the URL
function getAnswerFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('answer');
   return  urlParams.get('question')
}

// Display the answer on the page
const answer = getAnswerFromURL();
if (answer) {
    document.getElementById('answerContainer').innerHTML = `<p>${decodeURIComponent(answer)}</p>`;
} else {
    document.getElementById('answerContainer').innerHTML = '<p>No answer available.</p>';
}
