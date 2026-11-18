/* Catálogo del curso: un tema = una presentación. IDs: <nivel>-<bloque><nn>, p. ej. a1-g03 */
window.CATALOG = {
  available: ["a1-f01", "a1-f02", "a1-f03", "a1-f04", "a1-f05", "a1-f06", "a1-f07", "a1-f08", "a1-g01", "a1-g02", "a1-g03", "a1-g04", "a1-g05", "a1-g06", "a1-g07", "a1-g08", "a1-g09", "a1-g10", "a1-g11", "a1-g12", "a1-g13", "a1-g14", "a1-g15", "a1-g16", "a1-g17", "a1-g18", "a1-g19", "a1-g20", "a1-g21", "a1-g22", "a1-h01", "a1-h02", "a1-h03", "a1-h04", "a1-p01", "a1-p02", "a1-p03", "a1-p04", "a1-p05", "a1-p06", "a1-v01", "a1-v02", "a1-v03", "a1-v04", "a1-v05", "a1-v06", "a1-v07", "a1-v08", "a1-v09", "a1-v10", "a1-v11", "a1-v12", "a1-v13", "a1-v14", "a1-v15", "a1-v16", "a2-f01", "a2-f02", "a2-f03", "a2-f04", "a2-f05", "a2-f06", "a2-f07", "a2-f08", "a2-f09", "a2-g01", "a2-g02", "a2-g03", "a2-g04", "a2-g05", "a2-g06", "a2-g07", "a2-g08", "a2-g09", "a2-g10", "a2-g11", "a2-g12", "a2-g13", "a2-g14", "a2-g15", "a2-g16", "a2-g17", "a2-g18", "a2-g19", "a2-g20", "a2-g21", "a2-g22", "a2-g23", "a2-g24", "a2-h01", "a2-h02", "a2-h03", "a2-h04", "a2-p01", "a2-p02", "a2-p03", "a2-p04", "a2-p05", "a2-p06", "a2-v01", "a2-v02", "a2-v03", "a2-v04", "a2-v05", "a2-v06", "a2-v07", "a2-v08", "a2-v09", "a2-v10", "a2-v11", "a2-v12", "a2-v13", "a2-v14", "b1-f01", "b1-f02", "b1-f03", "b1-f04", "b1-f05", "b1-f06", "b1-f07", "b1-f08", "b1-f09", "b1-g01", "b1-g02", "b1-g03", "b1-g04", "b1-g05", "b1-g06", "b1-g07", "b1-g08", "b1-g09", "b1-g10", "b1-g11", "b1-g12", "b1-g13", "b1-g14", "b1-g15", "b1-g16", "b1-g17", "b1-g18", "b1-g19", "b1-g20", "b1-g21", "b1-g22", "b1-g23", "b1-g24", "b1-h01", "b1-h02", "b1-h03", "b1-h04", "b1-p01", "b1-p02", "b1-p03", "b1-p04", "b1-p05", "b1-v01", "b1-v02", "b1-v03", "b1-v04", "b1-v05", "b1-v06", "b1-v07", "b1-v08", "b1-v09", "b1-v10", "b1-v11", "b1-v12", "b1-v13", "b1-v14", "b2-f01", "b2-f02", "b2-f03", "b2-f04", "b2-f05", "b2-f06", "b2-f07", "b2-f08", "b2-g01", "b2-g02", "b2-g03", "b2-g04", "b2-g05", "b2-g06", "b2-g07", "b2-g08", "b2-g09", "b2-g10", "b2-g11", "b2-g12", "b2-g13", "b2-g14", "b2-g15", "b2-g16", "b2-g17", "b2-g18", "b2-g19", "b2-g20", "b2-g21", "b2-g22", "b2-h01", "b2-h02", "b2-h03", "b2-h04", "b2-p01", "b2-p02", "b2-p03", "b2-p04", "b2-p05", "b2-p06", "b2-v01", "b2-v02", "b2-v03", "b2-v04", "b2-v05", "b2-v06", "b2-v07", "b2-v08", "b2-v09", "b2-v10", "b2-v11", "b2-v12", "b2-v13", "c1-f01", "c1-f02", "c1-f03", "c1-f04", "c1-f05", "c1-f06", "c1-f07", "c1-g01", "c1-g02", "c1-g03", "c1-g04", "c1-g05", "c1-g06", "c1-g07", "c1-g08", "c1-g09", "c1-g10", "c1-g11", "c1-g12", "c1-g13", "c1-g14", "c1-g15", "c1-g16", "c1-h01", "c1-h02", "c1-h03", "c1-h04", "c1-p01", "c1-p02", "c1-p03", "c1-p04", "c1-v01", "c1-v02", "c1-v03", "c1-v04", "c1-v05", "c1-v06", "c1-v07", "c1-v08", "c1-v09", "c1-v10", "c1-v11", "c2-f01", "c2-f02", "c2-f03", "c2-f04", "c2-f05", "c2-g01", "c2-g02", "c2-g03", "c2-g04", "c2-g05", "c2-g06", "c2-g07", "c2-g08", "c2-g09", "c2-h01", "c2-h02", "c2-h03", "c2-h04", "c2-p01", "c2-p02", "c2-p03", "c2-v01", "c2-v02", "c2-v03", "c2-v04", "c2-v05", "c2-v06", "c2-v07", "c2-v08"],
  levels: [
    {
      id: "a1", name: "A1", label: "Breakthrough", lang: "es", band: "a",
      blocks: [
        { key: "g", topics: [
          "Alfabeto, deletreo y números cardinales y ordinales",
          "Pronombres personales sujeto",
          "Verbo to be en presente",
          "Artículos a / an / the",
          "Plurales regulares e irregulares",
          "Adjetivos posesivos y genitivo sajón",
          "Demostrativos this / that / these / those",
          "There is / there are",
          "Have got para posesión",
          "Presente simple",
          "Adverbios de frecuencia",
          "Pronombres interrogativos",
          "Can / can't",
          "Imperativo",
          "Preposiciones de lugar",
          "Preposiciones de tiempo at / on / in",
          "Presente continuo",
          "Contables e incontables con some / any",
          "Like / love / hate + sustantivo o -ing",
          "Pronombres objeto",
          "Conectores and, but, or, because",
          "Was / were, primer pasado simple, going to y comparativos"
        ]},
        { key: "v", topics: [
          "Saludos, despedidas y cortesía",
          "Países, nacionalidades e idiomas",
          "La familia",
          "Profesiones y lugares de trabajo",
          "Objetos del aula y de la casa",
          "Colores, formas y tamaños",
          "Días, meses, estaciones, la hora y la fecha",
          "Comida, bebida y comidas del día",
          "Rutina diaria y tiempo libre",
          "Ropa básica",
          "Partes del cuerpo",
          "El clima",
          "Lugares de la ciudad",
          "Medios de transporte",
          "Animales comunes",
          "Descripción física y personalidad"
        ]},
        { key: "f", topics: [
          "Presentarse y presentar a otros",
          "Dar y pedir información personal",
          "Describir familia, casa y rutina",
          "Expresar gustos y preferencias",
          "Preguntar y decir la hora",
          "Pedir comida y preguntar precios",
          "Pedir que repitan o hablen más despacio",
          "Dar instrucciones simples"
        ]},
        { key: "p", topics: [
          "Sonidos del alfabeto y deletreo",
          "Vocales /ɪ/ e /iː/",
          "Terminación -s: /s/, /z/, /ɪz/",
          "Contracciones",
          "Acento en -teen y -ty",
          "Entonación de preguntas"
        ]},
        { key: "h", topics: [
          "Lectura: letreros, menús y formularios",
          "Escucha: números, precios y horas",
          "Escritura: formularios y mensajes cortos",
          "Expresión oral: presentación personal"
        ]}
      ]
    },
    {
      id: "a2", name: "A2", label: "Waystage", lang: "es", band: "a",
      blocks: [
        { key: "g", topics: [
          "Pasado de to be (consolidación)",
          "Pasado simple regular e irregular",
          "Expresiones de tiempo pasado",
          "Pasado continuo y while / when",
          "Futuro con going to y will",
          "Presente continuo con valor de futuro",
          "Presente perfecto: ever, never, just, already, yet",
          "Presente simple vs continuo y verbos de estado",
          "Comparativos, superlativos y as…as",
          "Adverbios de modo y de grado",
          "Cuantificadores",
          "Modales must, have to, should, could",
          "Peticiones y ofrecimientos",
          "Verbo + -ing / verbo + to",
          "Infinitivo de propósito",
          "Pronombres posesivos y whose",
          "Pronombres indefinidos some-, any-, no-, every-",
          "Pronombres reflexivos",
          "Primer condicional",
          "Relativas especificativas: who, which, that, where",
          "Preguntas con preposición final",
          "Used to",
          "Conectores de secuencia y although",
          "Preposiciones de movimiento"
        ]},
        { key: "v", topics: [
          "Viajes y alojamiento",
          "Compras, tiendas y dinero",
          "Salud y visita al médico",
          "Deportes y ocio",
          "Tecnología cotidiana",
          "Estudios y asignaturas",
          "Trabajo: tareas y condiciones",
          "Direcciones en la ciudad",
          "Fiestas y celebraciones",
          "Medio ambiente y naturaleza",
          "Sentimientos y estados de ánimo",
          "Verbos frasales frecuentes",
          "Colocaciones con make, do, have, take",
          "Prefijos negativos un-, dis-"
        ]},
        { key: "f", topics: [
          "Narrar experiencias pasadas",
          "Planes, intenciones y predicciones",
          "Comparar personas, lugares y objetos",
          "Pedir y dar direcciones",
          "Invitar, aceptar y rechazar",
          "Pedir y dar consejo",
          "Obligación y prohibición",
          "Reservas, compras y quejas simples",
          "Hablar por teléfono"
        ]},
        { key: "p", topics: [
          "Terminación -ed: /t/, /d/, /ɪd/",
          "Formas débiles y schwa",
          "Acento de palabra",
          "Sonidos /θ/ y /ð/",
          "/v/ vs /b/ y /ʃ/ vs /tʃ/",
          "Ritmo y palabras de contenido"
        ]},
        { key: "h", topics: [
          "Lectura: correos, anuncios y horarios",
          "Escucha: anuncios y mensajes de voz",
          "Escritura: correos y narración breve",
          "Expresión oral: describir fotos y juegos de rol"
        ]}
      ]
    },
    {
      id: "b1", name: "B1", label: "Threshold", lang: "en", band: "b",
      blocks: [
        { key: "g", topics: [
          "Present perfect: experience, result, for / since",
          "Present perfect continuous",
          "Past perfect",
          "Future forms review",
          "Future continuous",
          "Second and third conditionals",
          "Zero conditional",
          "Unless, as long as, in case",
          "Passive voice: present and past simple",
          "Reported speech: statements, questions, commands",
          "Modals of deduction and should have / might have",
          "Be able to, be allowed to, need to, ought to",
          "Used to / be used to / get used to",
          "Non-defining relative clauses",
          "Question tags",
          "Indirect questions",
          "Gerund vs infinitive: stop, remember, try",
          "So / such, too / enough",
          "Causative have / get something done",
          "Wish + past simple",
          "Linkers of contrast, cause and result",
          "-ed vs -ing adjectives",
          "Adjective order",
          "Articles: special uses"
        ]},
        { key: "v", topics: [
          "Education and school systems",
          "Work, job interviews and CVs",
          "Media and news",
          "Film, music and the arts",
          "Environment and social issues",
          "Relationships and personality",
          "Health and lifestyle",
          "Science and technology",
          "Crime and justice (basics)",
          "Travel: airports and problems",
          "Topic-based phrasal verbs",
          "Word formation: suffixes",
          "Collocations and fixed expressions",
          "False friends"
        ]},
        { key: "f", topics: [
          "Telling stories and anecdotes",
          "Giving and justifying opinions",
          "Hypothetical situations",
          "Speculating about the present",
          "Reporting what others said",
          "Advice and suggestions",
          "Expressing feelings and reactions",
          "Asking for clarification and rephrasing",
          "Simple job interviews"
        ]},
        { key: "p", topics: [
          "Sentence stress and weak forms",
          "Linking between words",
          "Intonation in question tags",
          "Word stress with suffixes",
          "Initial consonant clusters"
        ]},
        { key: "h", topics: [
          "Reading: articles, reviews and graded readers",
          "Listening: interviews and podcasts",
          "Writing: emails, articles, stories and reviews",
          "Speaking: conversation, photos and pair tasks"
        ]}
      ]
    },
    {
      id: "b2", name: "B2", label: "Vantage", lang: "en", band: "b",
      blocks: [
        { key: "g", topics: [
          "Tense and aspect review",
          "Past perfect continuous",
          "Future perfect simple and continuous",
          "Third and mixed conditionals",
          "Wish / if only: regrets and complaints",
          "Passive in all tenses and with modals",
          "Impersonal passive",
          "Causatives: have, get, make, let",
          "Modals of deduction in the past",
          "Past modals of criticism and regret",
          "Advanced reported speech and reporting verbs",
          "Advanced relative clauses",
          "Participle clauses",
          "Advanced linkers of contrast and purpose",
          "It's time / I'd rather / I'd prefer",
          "Future in the past",
          "Negative inversion (introduction)",
          "Cleft sentences",
          "Determiners: all, both, each, every, either, neither",
          "Compound nouns and possessives",
          "Three-part phrasal verbs",
          "Gradable and absolute adjectives"
        ]},
        { key: "v", topics: [
          "Globalisation, economy and consumption",
          "Politics and society",
          "Science, innovation and tech ethics",
          "Psychology and behaviour",
          "Work: leadership, meetings, negotiation",
          "Art, culture and heritage",
          "Public health and medicine",
          "Basic academic vocabulary",
          "Advanced word formation: prefixes",
          "Collocations",
          "Common idioms",
          "Synonyms and register",
          "Describing trends and data"
        ]},
        { key: "f", topics: [
          "Arguing for and against",
          "Speculating about past and future",
          "Regret, criticism and reproach",
          "Describing graphs and data",
          "Negotiating and persuading",
          "Summarising texts and talks",
          "Structured presentations",
          "Managing turn-taking"
        ]},
        { key: "p", topics: [
          "Contrastive and emphatic stress",
          "Intonation and attitude",
          "Elision and assimilation",
          "Weak forms in past modals",
          "/æ/ /ʌ/ /ɑː/",
          "Silent letters"
        ]},
        { key: "h", topics: [
          "Reading: opinion and press articles",
          "Listening: lectures, debates and series",
          "Writing: essays, reports, proposals and reviews",
          "Speaking: long turn, debate and presentation"
        ]}
      ]
    },
    {
      id: "c1", name: "C1", label: "Effective Operational Proficiency", lang: "en", band: "c",
      blocks: [
        { key: "g", topics: [
          "Negative and restrictive inversion",
          "Conditional inversion",
          "Advanced cleft sentences",
          "The subjunctive and as if / as though",
          "Alternatives to if",
          "Modal nuances: be bound to, be due to, be to",
          "Distancing structures",
          "Nominalisation",
          "Ellipsis and substitution",
          "Participle and absolute clauses",
          "Fronting for emphasis",
          "Complex verb complementation",
          "Advanced determiners and quantifiers",
          "Academic and conversational discourse markers",
          "Hedging",
          "Advanced comparisons"
        ]},
        { key: "v", topics: [
          "Academic Word List by discipline",
          "Professional English: finance, marketing, projects, HR",
          "Politics, law and international relations",
          "Philosophy, ethics and critical thinking",
          "Media, advertising and persuasion",
          "Idioms, binomials and similes",
          "Multi-meaning phrasal verbs and formal equivalents",
          "Strong and weak collocations",
          "Connotation",
          "Figurative language and metaphor",
          "British and American English"
        ]},
        { key: "f", topics: [
          "Building and rebutting complex arguments",
          "Synthesising multiple sources",
          "Shades of certainty, doubt and attitude",
          "Chairing meetings and debates",
          "Academic and professional presentations",
          "Adapting register",
          "Diplomacy and indirect politeness"
        ]},
        { key: "p", topics: [
          "Intonation in extended discourse",
          "Connected speech: intrusion and elision",
          "Understanding regional accents",
          "International intelligibility and persuasive prosody"
        ]},
        { key: "h", topics: [
          "Reading: academic and technical texts",
          "Listening: lectures and films without subtitles",
          "Writing: argumentative essays, reports and summaries",
          "Speaking: long presentations and negotiation"
        ]}
      ]
    },
    {
      id: "c2", name: "C2", label: "Mastery", lang: "en", band: "c",
      blocks: [
        { key: "g", topics: [
          "Expert review: structures for stylistic effect",
          "Full inversion and emphasis",
          "Formulaic subjunctive",
          "Tense for modality and social distance",
          "Ellipsis and reference in long texts",
          "Aspect and modality in legal, academic and literary texts",
          "Complex syntax: subordination and apposition",
          "Spoken vs written grammar",
          "Idiomatic articles, prepositions and particles"
        ]},
        { key: "v", topics: [
          "Low-frequency and specialised vocabulary",
          "Idioms, proverbs and cultural expressions",
          "Wordplay, irony and humour",
          "Neologisms and slang",
          "Literary and rhetorical language",
          "Etymology: Latin and Greek roots",
          "Fine distinctions between synonyms",
          "World Englishes"
        ]},
        { key: "f", topics: [
          "Fluent unprepared persuasive speech",
          "Seamless reformulation",
          "Humour, irony and cultural allusion",
          "Mediating between people and cultures",
          "Precision in every register"
        ]},
        { key: "p", topics: [
          "Prosody for rhetorical effect",
          "Strong accents, dialects and fast speech",
          "Natural international intelligibility"
        ]},
        { key: "h", topics: [
          "Reading: literature, legal and philosophical texts",
          "Listening: any kind of discourse",
          "Writing: critical essays and creative writing",
          "Speaking: lectures, formal debate and mediation"
        ]}
      ]
    }
  ]
};
