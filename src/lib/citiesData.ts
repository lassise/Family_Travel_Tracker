// Expanded cities database for each country - includes major cities, tourist destinations, and popular towns
// This list covers popular travel destinations worldwide

const citiesByCountry: Record<string, string[]> = {
  // Afghanistan
  AF: [
    "Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad", "Kunduz",
    "Ghazni", "Balkh", "Bamiyan", "Faizabad", "Lashkar Gah", "Taloqan",
    "Puli Khumri", "Sheberghan", "Charikar", "Mehtarlam", "Gardez",
    "Band-e-Amir", "Panjshir Valley", "Wakhan Corridor", "Nuristan"
  ],
  // Albania - already exists at AL
  // Algeria
  DZ: [
    "Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif",
    "Djelfa", "Tlemcen", "Bejaia", "Ghardaia", "Timimoun", "Tamanrasset",
    "Djanet", "Tassili n'Ajjer", "Tipaza", "Djémila", "Timgad"
  ],
  // Angola
  AO: [
    "Luanda", "Huambo", "Lobito", "Benguela", "Lubango", "Namibe",
    "Malanje", "Cabinda", "Kuito", "Soyo", "Tombwa", "Kissama National Park"
  ],
  // Antigua and Barbuda
  AG: [
    "St. John's", "English Harbour", "Jolly Harbour", "Dickenson Bay",
    "Nelson's Dockyard", "Barbuda", "Half Moon Bay"
  ],
  // Armenia - already exists at AM
  // Aruba
  AW: [
    "Oranjestad", "San Nicolas", "Palm Beach", "Eagle Beach", "Arikok National Park",
    "Baby Beach", "Natural Bridge", "California Lighthouse"
  ],
  // Austria - already exists at AT
  // Azerbaijan - already exists at AZ
  // Bahamas
  BS: [
    "Nassau", "Freeport", "Paradise Island", "Exuma", "Eleuthera",
    "Harbour Island", "Andros", "Bimini", "Long Island", "Cat Island",
    "San Salvador", "Atlantis", "Cable Beach", "Pig Beach"
  ],
  // Bahrain - already exists at BH
  // Bangladesh
  BD: [
    "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Rangpur",
    "Cox's Bazar", "Sundarbans", "Srimangal", "Paharpur", "Bagerhat",
    "Rangamati", "Bandarban", "Saint Martin's Island", "Sonargaon"
  ],
  // Barbados
  BB: [
    "Bridgetown", "Speightstown", "Holetown", "Oistins", "Bathsheba",
    "St. Lawrence Gap", "Crane Beach", "Harrison's Cave", "Carlisle Bay"
  ],
  // Belarus - already exists at BY
  // Belgium - already exists at BE
  // Belize - already exists at BZ
  // Benin
  BJ: [
    "Cotonou", "Porto-Novo", "Parakou", "Djougou", "Ouidah", "Abomey",
    "Ganvié", "Natitingou", "Pendjari National Park"
  ],
  // Bermuda
  BM: [
    "Hamilton", "St. George's", "Somerset Village", "Horseshoe Bay",
    "Elbow Beach", "Crystal Caves", "Royal Naval Dockyard"
  ],
  // Bhutan
  BT: [
    "Thimphu", "Paro", "Punakha", "Bumthang", "Wangdue Phodrang",
    "Tiger's Nest", "Trongsa", "Haa", "Phobjikha Valley", "Dochula Pass"
  ],
  // Bolivia - already exists at BO
  // Bosnia and Herzegovina - already exists at BA
  // Botswana
  BW: [
    "Gaborone", "Francistown", "Maun", "Kasane", "Palapye", "Serowe",
    "Okavango Delta", "Chobe National Park", "Makgadikgadi Pans",
    "Moremi Game Reserve", "Kalahari Desert", "Tsodilo Hills"
  ],
  // Brazil - already exists at BR
  // Brunei
  BN: [
    "Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong",
    "Ulu Temburong National Park", "Kampong Ayer", "Jerudong Park"
  ],
  // Bulgaria - already exists at BG
  // Burkina Faso
  BF: [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora",
    "Sindou Peaks", "Ruins of Loropéni", "Nazinga Game Ranch"
  ],
  // Burundi
  BI: [
    "Bujumbura", "Gitega", "Muyinga", "Ngozi", "Rumonge",
    "Lake Tanganyika", "Kibira National Park", "Source of the Nile"
  ],
  // Cabo Verde (Cape Verde)
  CV: [
    "Praia", "Mindelo", "Santa Maria", "Espargos", "São Filipe",
    "Sal", "Boa Vista", "Santo Antão", "Fogo", "São Vicente"
  ],
  // Cambodia - already exists at KH
  // Cameroon
  CM: [
    "Yaoundé", "Douala", "Garoua", "Bamenda", "Maroua", "Kribi",
    "Limbe", "Buea", "Mount Cameroon", "Waza National Park", "Dja Reserve"
  ],
  // Canada - already exists at CA
  // Central African Republic
  CF: [
    "Bangui", "Bimbo", "Berbérati", "Bozoum", "Dzanga-Sangha"
  ],
  // Chad
  TD: [
    "N'Djamena", "Moundou", "Sarh", "Abéché", "Faya-Largeau",
    "Zakouma National Park", "Lake Chad", "Ennedi Plateau"
  ],
  // Chile - already exists at CL
  // China - already exists at CN
  // Colombia - already exists at CO
  // Comoros
  KM: [
    "Moroni", "Mutsamudu", "Fomboni", "Grande Comore", "Mohéli", "Anjouan"
  ],
  // Congo (Republic)
  CG: [
    "Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Odzala National Park"
  ],
  // Congo (DRC)
  CD: [
    "Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kisangani", "Goma",
    "Virunga National Park", "Bukavu", "Kahuzi-Biéga", "Garamba"
  ],
  // Costa Rica - already exists at CR
  // Côte d'Ivoire (Ivory Coast)
  CI: [
    "Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro",
    "Grand-Bassam", "Assinie", "Korhogo", "Man", "Taï National Park"
  ],
  // Croatia - already exists at HR
  // Cuba - already exists at CU
  // Curaçao
  CW: [
    "Willemstad", "Westpunt", "Jan Thiel", "Mambo Beach",
    "Shete Boka National Park", "Playa Kenepa", "Christoffel Park"
  ],
  // Cyprus - already exists at CY
  // Czech Republic - already exists at CZ
  // Denmark - already exists at DK
  // Djibouti
  DJ: [
    "Djibouti City", "Ali Sabieh", "Tadjoura", "Obock",
    "Lake Assal", "Lake Abbe", "Day Forest National Park"
  ],
  // Dominica
  DM: [
    "Roseau", "Portsmouth", "Marigot", "Calibishie", "Trafalgar Falls",
    "Boiling Lake", "Morne Trois Pitons", "Champagne Reef"
  ],
  // Dominican Republic - already exists at DO
  // Ecuador - already exists at EC
  // Egypt - already exists at EG
  // El Salvador - already exists at SV
  // Equatorial Guinea
  GQ: [
    "Malabo", "Bata", "Ebebiyin", "Bioko Island", "Monte Alén"
  ],
  // Eritrea
  ER: [
    "Asmara", "Massawa", "Keren", "Assab", "Dahlak Archipelago"
  ],
  // Estonia - already exists at EE
  // Eswatini (Swaziland)
  SZ: [
    "Mbabane", "Manzini", "Lobamba", "Mlilwane", "Hlane Royal National Park",
    "Mkhaya Game Reserve", "Malolotja Nature Reserve"
  ],
  // Ethiopia
  ET: [
    "Addis Ababa", "Dire Dawa", "Gondar", "Mekelle", "Bahir Dar",
    "Lalibela", "Axum", "Harar", "Simien Mountains", "Danakil Depression",
    "Omo Valley", "Lake Tana", "Blue Nile Falls", "Bale Mountains"
  ],
  // Fiji - already exists at FJ
  // Finland - already exists at FI
  // France - already exists at FR
  // Gabon
  GA: [
    "Libreville", "Port-Gentil", "Franceville", "Oyem",
    "Lopé National Park", "Ivindo National Park", "Loango National Park"
  ],
  // Gambia
  GM: [
    "Banjul", "Serekunda", "Brikama", "Bakau", "Kololi",
    "Kunta Kinteh Island", "Makasutu", "Abuko Nature Reserve"
  ],
  // Georgia - already exists at GE
  // Germany - already exists at DE
  // Ghana
  GH: [
    "Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Cape Coast",
    "Elmina", "Ada Foah", "Mole National Park", "Kakum National Park"
  ],
  // Greece - already exists at GR
  // Greenland
  GL: [
    "Nuuk", "Ilulissat", "Sisimiut", "Qaqortoq", "Uummannaq",
    "Kangerlussuaq", "Tasiilaq", "Disko Bay", "Scoresby Sound"
  ],
  // Grenada
  GD: [
    "St. George's", "Grenville", "Gouyave", "Grand Anse Beach",
    "Carriacou", "Petite Martinique", "Grand Etang"
  ],
  // Guatemala - already exists at GT
  // Guinea
  GN: [
    "Conakry", "Nzérékoré", "Kindia", "Labé", "Kankan",
    "Fouta Djallon", "Mount Nimba", "Îles de Los"
  ],
  // Guinea-Bissau
  GW: [
    "Bissau", "Bafatá", "Gabú", "Cacheu", "Bijagós Archipelago"
  ],
  // Guyana
  GY: [
    "Georgetown", "Linden", "New Amsterdam", "Bartica",
    "Kaieteur Falls", "Iwokrama Forest", "Rupununi Savanna"
  ],
  // Haiti
  HT: [
    "Port-au-Prince", "Cap-Haïtien", "Jacmel", "Les Cayes",
    "Citadelle Laferrière", "Labadee", "Île-à-Vache", "Saut-Mathurine"
  ],
  // Honduras - already exists at HN
  // Hungary - already exists at HU
  // Iceland - already exists at IS
  // India - already exists at IN
  // Indonesia - already exists at ID
  // Iran
  IR: [
    "Tehran", "Mashhad", "Isfahan", "Shiraz", "Tabriz", "Karaj",
    "Yazd", "Kerman", "Persepolis", "Pasargadae", "Nasir al-Mulk Mosque",
    "Naqsh-e Jahan Square", "Golestan Palace", "Dasht-e Kavir"
  ],
  // Iraq
  IQ: [
    "Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", "Kirkuk",
    "Najaf", "Karbala", "Samarra", "Babylon", "Ur", "Hatra"
  ],
  // Ireland - already exists at IE
  // Israel - already exists at IL
  // Italy - already exists at IT
  // Jamaica - already exists at JM
  // Japan - already exists at JP
  // Jordan - already exists at JO
  // Kazakhstan
  KZ: [
    "Almaty", "Nur-Sultan (Astana)", "Shymkent", "Karaganda", "Aktobe",
    "Turkestan", "Charyn Canyon", "Kolsai Lakes", "Big Almaty Lake",
    "Altyn-Emel", "Baikonur", "Medeu", "Shymbulak"
  ],
  // Kenya - already exists at KE
  // Kiribati
  KI: [
    "South Tarawa", "Betio", "Bairiki", "Christmas Island", "Fanning Island"
  ],
  // North Korea
  KP: [
    "Pyongyang", "Hamhung", "Nampo", "Wonsan", "Kaesong",
    "Mount Paektu", "Kumgang Mountains", "Rason"
  ],
  // South Korea - already exists at KR
  // Kosovo - already exists at XK
  // Kuwait - already exists at KW
  // Kyrgyzstan
  KG: [
    "Bishkek", "Osh", "Karakol", "Jalal-Abad", "Tokmok",
    "Issyk-Kul Lake", "Song Kol Lake", "Ala Archa", "Tash Rabat"
  ],
  // Laos - already exists at LA
  // Latvia - already exists at LV
  // Lebanon - already exists at LB
  // Lesotho
  LS: [
    "Maseru", "Teyateyaneng", "Mafeteng", "Hlotse",
    "Semonkong", "Malealea", "Sehlabathebe National Park", "Katse Dam"
  ],
  // Liberia
  LR: [
    "Monrovia", "Gbarnga", "Buchanan", "Harper", "Sapo National Park"
  ],
  // Libya
  LY: [
    "Tripoli", "Benghazi", "Misrata", "Sabha", "Tobruk",
    "Leptis Magna", "Sabratha", "Ghadames", "Akakus Mountains"
  ],
  // Liechtenstein - already exists at LI
  // Lithuania - already exists at LT
  // Luxembourg - already exists at LU
  // Madagascar
  MG: [
    "Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga",
    "Nosy Be", "Île Sainte-Marie", "Andasibe", "Tsingy de Bemaraha",
    "Isalo National Park", "Ranomafana", "Morondava", "Avenue of the Baobabs"
  ],
  // Malawi
  MW: [
    "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Lake Malawi",
    "Cape Maclear", "Likoma Island", "Liwonde National Park"
  ],
  // Malaysia - already exists at MY
  // Maldives - already exists at MV
  // Mali
  ML: [
    "Bamako", "Sikasso", "Ségou", "Mopti", "Timbuktu",
    "Djenné", "Bandiagara", "Pays Dogon"
  ],
  // Malta - already exists at MT
  // Marshall Islands
  MH: [
    "Majuro", "Ebeye", "Bikini Atoll", "Arno Atoll"
  ],
  // Mauritania
  MR: [
    "Nouakchott", "Nouadhibou", "Kaédi", "Atar", "Chinguetti",
    "Banc d'Arguin", "Adrar Plateau", "Oualata"
  ],
  // Mauritius - already exists at MU
  // Mexico - already exists at MX
  // Micronesia
  FM: [
    "Palikir", "Weno", "Pohnpei", "Kosrae", "Yap", "Nan Madol"
  ],
  // Moldova - already exists at MD
  // Monaco - already exists at MC
  // Mongolia
  MN: [
    "Ulaanbaatar", "Erdenet", "Darkhan", "Choibalsan",
    "Gobi Desert", "Khuvsgul Lake", "Karakorum", "Terelj", "Altai Mountains"
  ],
  // Montenegro - already exists at ME
  // Morocco - already exists at MA
  // Mozambique
  MZ: [
    "Maputo", "Beira", "Nampula", "Quelimane", "Pemba",
    "Tofo Beach", "Bazaruto Archipelago", "Inhambane",
    "Gorongosa National Park", "Mozambique Island"
  ],
  // Myanmar - already exists at MM
  // Namibia
  NA: [
    "Windhoek", "Swakopmund", "Walvis Bay", "Rundu", "Oshakati",
    "Etosha National Park", "Sossusvlei", "Fish River Canyon",
    "Skeleton Coast", "Kolmanskop", "Damaraland", "Spitzkoppe"
  ],
  // Nauru
  NR: [
    "Yaren", "Denigomodu", "Aiwo", "Buada Lagoon"
  ],
  // Nepal - already exists at NP
  // Netherlands - already exists at NL
  // New Caledonia - already exists at NC
  // New Zealand - already exists at NZ
  // Nicaragua - already exists at NI
  // Niger
  NE: [
    "Niamey", "Zinder", "Maradi", "Agadez", "Tahoua",
    "W National Park", "Aïr Mountains", "Ténéré Desert"
  ],
  // Nigeria
  NG: [
    "Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City",
    "Calabar", "Enugu", "Kaduna", "Oshogbo", "Yankari National Park"
  ],
  // North Macedonia - already exists at MK
  // Norway - already exists at NO
  // Oman - already exists at OM
  // Pakistan
  PK: [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar",
    "Hunza Valley", "Gilgit", "Skardu", "Swat Valley", "Taxila",
    "Mohenjo-daro", "Fairy Meadows", "K2 Base Camp", "Multan"
  ],
  // Palau
  PW: [
    "Ngerulmud", "Koror", "Rock Islands", "Jellyfish Lake", "Peleliu"
  ],
  // Palestine
  PS: [
    "Jerusalem", "Ramallah", "Gaza City", "Bethlehem", "Nablus",
    "Hebron", "Jericho", "Dead Sea"
  ],
  // Panama - already exists at PA
  // Papua New Guinea - already exists at PG
  // Paraguay - already exists at PY
  // Peru - already exists at PE
  // Philippines - already exists at PH
  // Poland - already exists at PL
  // Portugal - already exists at PT
  // Qatar - already exists at QA
  // Romania - already exists at RO
  // Russia - already exists at RU
  // Rwanda
  RW: [
    "Kigali", "Butare", "Gisenyi", "Ruhengeri", "Volcanoes National Park",
    "Lake Kivu", "Akagera National Park", "Nyungwe Forest"
  ],
  // Saint Kitts and Nevis
  KN: [
    "Basseterre", "Charlestown", "Brimstone Hill", "Nevis Peak",
    "Frigate Bay", "Cockleshell Beach"
  ],
  // Saint Lucia
  LC: [
    "Castries", "Soufrière", "Rodney Bay", "Gros Islet", "Marigot Bay",
    "Pitons", "Sulphur Springs", "Pigeon Island"
  ],
  // Saint Vincent and the Grenadines
  VC: [
    "Kingstown", "Bequia", "Mustique", "Canouan", "Tobago Cays",
    "Union Island", "La Soufrière"
  ],
  // Samoa - already exists at WS
  // San Marino - already exists at SM
  // São Tomé and Príncipe
  ST: [
    "São Tomé", "Santo António", "Príncipe", "Bom Bom Island",
    "Pico Cão Grande", "Obo National Park"
  ],
  // Saudi Arabia - already exists at SA
  // Senegal
  SN: [
    "Dakar", "Saint-Louis", "Thiès", "Touba", "Ziguinchor",
    "Gorée Island", "Pink Lake", "Saloum Delta", "Casamance"
  ],
  // Serbia - already exists at RS
  // Seychelles - already exists at SC
  // Sierra Leone
  SL: [
    "Freetown", "Bo", "Kenema", "Makeni", "Bonthe",
    "River No. 2 Beach", "Tiwai Island", "Banana Islands"
  ],
  // Singapore - already exists at SG
  // Slovakia - already exists at SK
  // Slovenia - already exists at SI
  // Solomon Islands
  SB: [
    "Honiara", "Auki", "Gizo", "Munda", "Marovo Lagoon",
    "Western Province", "Guadalcanal"
  ],
  // Somalia
  SO: [
    "Mogadishu", "Hargeisa", "Berbera", "Kismayo", "Bosaso", "Laas Geel"
  ],
  // South Africa - already exists at ZA
  // South Sudan
  SS: [
    "Juba", "Wau", "Malakal", "Bor", "Sudd Wetlands"
  ],
  // Spain - already exists at ES
  // Sri Lanka - already exists at LK
  // Sudan
  SD: [
    "Khartoum", "Omdurman", "Port Sudan", "Kassala", "Wadi Halfa",
    "Meroe", "Jebel Barkal", "Nuri Pyramids"
  ],
  // Suriname
  SR: [
    "Paramaribo", "Nieuw Nickerie", "Moengo", "Brownsweg",
    "Raleighvallen", "Central Suriname Nature Reserve"
  ],
  // Sweden - already exists at SE
  // Switzerland - already exists at CH
  // Syria
  SY: [
    "Damascus", "Aleppo", "Homs", "Latakia", "Palmyra",
    "Krak des Chevaliers", "Bosra", "Apamea"
  ],
  // Taiwan
  TW: [
    "Taipei", "Kaohsiung", "Taichung", "Tainan", "Hsinchu", "Keelung",
    "Jiufen", "Taroko Gorge", "Sun Moon Lake", "Alishan", "Kenting",
    "Yehliu", "Penghu", "Orchid Island", "Green Island"
  ],
  // Tajikistan
  TJ: [
    "Dushanbe", "Khujand", "Panjakent", "Khorog", "Pamir Highway",
    "Iskanderkul", "Fann Mountains", "Wakhan Valley"
  ],
  // Tanzania - already exists at TZ
  // Thailand - already exists at TH
  // Timor-Leste (East Timor)
  TL: [
    "Dili", "Baucau", "Maliana", "Same", "Atauro Island",
    "Jaco Island", "Mount Ramelau"
  ],
  // Togo
  TG: [
    "Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé",
    "Togoville", "Fazao-Malfakassa National Park"
  ],
  // Tonga - already exists at TO
  // Trinidad and Tobago
  TT: [
    "Port of Spain", "San Fernando", "Chaguanas", "Scarborough",
    "Maracas Bay", "Tobago", "Pigeon Point", "Pitch Lake", "Asa Wright"
  ],
  // Tunisia
  TN: [
    "Tunis", "Sfax", "Sousse", "Kairouan", "Gabès", "Bizerte",
    "Sidi Bou Said", "Carthage", "Djerba", "Tozeur", "Douz",
    "El Jem", "Dougga", "Chott el-Jerid"
  ],
  // Turkey - already exists at TR
  // Turkmenistan
  TM: [
    "Ashgabat", "Türkmenbaşy", "Mary", "Merv", "Daşoguz",
    "Darvaza Gas Crater", "Kow Ata", "Ancient Merv"
  ],
  // Turks and Caicos
  TC: [
    "Cockburn Town", "Providenciales", "Grace Bay", "Grand Turk",
    "Salt Cay", "North Caicos", "Middle Caicos"
  ],
  // Tuvalu
  TV: [
    "Funafuti", "Vaiaku", "Nanumea", "Nukufetau"
  ],
  // Uganda
  UG: [
    "Kampala", "Entebbe", "Jinja", "Mbarara", "Gulu", "Fort Portal",
    "Bwindi Impenetrable Forest", "Queen Elizabeth National Park",
    "Murchison Falls", "Lake Bunyonyi", "Kibale National Park",
    "Source of the Nile"
  ],
  // Ukraine - already exists at UA
  // United Arab Emirates - already exists at AE
  // United Kingdom - already exists at GB
  // United States - already exists at US
  // Uruguay - already exists at UY
  // Uzbekistan
  UZ: [
    "Tashkent", "Samarkand", "Bukhara", "Khiva", "Fergana",
    "Registan Square", "Shah-i-Zinda", "Itchan Kala", "Aral Sea"
  ],
  // Vanuatu - already exists at VU
  // Vatican City - already exists at VA
  // Venezuela
  VE: [
    "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Mérida",
    "Angel Falls", "Los Roques", "Canaima National Park", "Margarita Island",
    "Morrocoy", "Coro", "Orinoco Delta", "Gran Sabana", "Mount Roraima"
  ],
  // Vietnam - already exists at VN
  // Yemen
  YE: [
    "Sana'a", "Aden", "Taiz", "Al Hudaydah", "Mukalla",
    "Socotra Island", "Shibam", "Old City of Sana'a", "Shahara"
  ],
  // Zambia
  ZM: [
    "Lusaka", "Kitwe", "Ndola", "Livingstone", "Kabwe",
    "Victoria Falls", "South Luangwa", "Lower Zambezi",
    "Kafue National Park", "Lake Kariba", "Devil's Pool"
  ],
  // Zimbabwe
  ZW: [
    "Harare", "Bulawayo", "Mutare", "Gweru", "Victoria Falls",
    "Hwange National Park", "Matobo Hills", "Great Zimbabwe",
    "Mana Pools", "Lake Kariba", "Eastern Highlands"
  ],
  US: [
    "New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis", "Seattle",
    "Denver", "Washington D.C.", "Boston", "Nashville", "Baltimore", "Oklahoma City",
    "Louisville", "Portland", "Las Vegas", "Milwaukee", "Albuquerque", "Tucson",
    "Fresno", "Sacramento", "Mesa", "Kansas City", "Atlanta", "Miami", "Omaha",
    "Raleigh", "Minneapolis", "Cleveland", "New Orleans", "Honolulu", "Orlando",
    "Tampa", "Pittsburgh", "Cincinnati", "St. Louis", "Detroit", "Buffalo", "Salt Lake City",
    "Anchorage", "Sedona", "Santa Fe", "Savannah", "Charleston", "Key West", "Maui",
    "Aspen", "Park City", "Napa Valley", "Palm Springs", "Scottsdale", "Branson",
    "Myrtle Beach", "Virginia Beach", "Ocean City", "Lake Tahoe", "Yellowstone",
    "Grand Canyon Village", "Moab", "Jackson Hole", "Telluride", "Carmel-by-the-Sea",
    "Monterey", "Santa Barbara", "San Luis Obispo", "Paso Robles", "Solvang",
    "Newport Beach", "Laguna Beach", "Huntington Beach", "Long Beach", "Pasadena",
    "Palm Desert", "Joshua Tree", "Big Sur", "Yosemite Valley", "Mammoth Lakes",
    "Lake Placid", "Cape Cod", "Martha's Vineyard", "Nantucket", "Bar Harbor",
    "Newport", "Providence", "Burlington", "Portland (Maine)", "Kennebunkport"
  ],
  GB: [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Bristol",
    "Edinburgh", "Leeds", "Sheffield", "Newcastle", "Nottingham", "Southampton",
    "Brighton", "Oxford", "Cambridge", "York", "Bath", "Cardiff", "Belfast",
    "Stratford-upon-Avon", "Canterbury", "Windsor", "Salisbury", "Chester",
    "Durham", "St Andrews", "Inverness", "Aberdeen", "Fort William", "Stirling",
    "Lake District", "Cotswolds", "Peak District", "Cornwall", "Devon", "Bournemouth",
    "Blackpool", "Scarborough", "Whitby", "Harrogate", "St Ives", "Torquay",
    "Plymouth", "Exeter", "Worcester", "Warwick", "Coventry", "Leicester",
    "Norwich", "Ipswich", "Lincoln", "Hull", "Swansea", "Snowdonia"
  ],
  FR: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
    "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Étienne",
    "Le Havre", "Grenoble", "Dijon", "Cannes", "Avignon", "Aix-en-Provence",
    "Saint-Tropez", "Monaco", "Menton", "Antibes", "Biarritz", "Bayonne",
    "Carcassonne", "Arles", "Nîmes", "Perpignan", "Toulouse", "Lourdes",
    "Chamonix", "Annecy", "Colmar", "Rouen", "Tours", "Amboise", "Blois",
    "Orléans", "Chartres", "Giverny", "Versailles", "Fontainebleau", "Honfleur",
    "Deauville", "Étretat", "Mont Saint-Michel", "Saint-Malo", "Quimper", "Carnac",
    "La Rochelle", "Poitiers", "Limoges", "Clermont-Ferrand", "Vichy"
  ],
  DE: [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf",
    "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg",
    "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Heidelberg",
    "Rothenburg ob der Tauber", "Bamberg", "Würzburg", "Regensburg", "Augsburg",
    "Freiburg", "Baden-Baden", "Konstanz", "Trier", "Koblenz", "Aachen",
    "Münster", "Lübeck", "Rostock", "Potsdam", "Weimar", "Erfurt", "Jena",
    "Garmisch-Partenkirchen", "Oberammergau", "Füssen", "Berchtesgaden",
    "Black Forest", "Rhine Valley", "Mosel Valley", "Bavarian Alps"
  ],
  IT: [
    "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence",
    "Venice", "Verona", "Catania", "Bari", "Padua", "Trieste", "Brescia", "Parma",
    "Modena", "Pisa", "Siena", "Amalfi", "Positano", "Ravello", "Sorrento",
    "Capri", "Ischia", "Cinque Terre", "Portofino", "San Gimignano", "Lucca",
    "Orvieto", "Assisi", "Perugia", "Spoleto", "Matera", "Lecce", "Gallipoli",
    "Taormina", "Syracuse", "Agrigento", "Cefalù", "Trapani", "Sardinia",
    "Alghero", "Cagliari", "Costa Smeralda", "Lake Como", "Lake Garda", "Lake Maggiore",
    "Bellagio", "Varenna", "Stresa", "Bergamo", "Mantua", "Cremona", "Ferrara",
    "Rimini", "San Marino", "Cortina d'Ampezzo", "Dolomites", "Merano", "Bolzano"
  ],
  ES: [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia",
    "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Granada",
    "Toledo", "San Sebastián", "Salamanca", "Ibiza", "Marbella", "Ronda",
    "Cádiz", "Jerez de la Frontera", "Tarifa", "Gibraltar", "Costa Brava",
    "Sitges", "Girona", "Figueres", "Montserrat", "Tarragona", "Tossa de Mar",
    "Pamplona", "Burgos", "León", "Santiago de Compostela", "A Coruña", "Vigo",
    "Oviedo", "Santander", "San Juan de Gaztelugatxe", "Formentera", "Menorca",
    "Tenerife", "Gran Canaria", "Lanzarote", "Fuerteventura", "La Palma",
    "Costa del Sol", "Nerja", "Frigiliana", "Antequera", "Cuenca", "Segovia", "Ávila"
  ],
  PT: [
    "Lisbon", "Porto", "Amadora", "Braga", "Coimbra", "Funchal", "Setúbal",
    "Almada", "Faro", "Sintra", "Lagos", "Cascais", "Évora", "Óbidos",
    "Nazaré", "Batalha", "Fátima", "Tomar", "Aveiro", "Guimarães", "Viana do Castelo",
    "Ponta Delgada", "Angra do Heroísmo", "Tavira", "Albufeira", "Portimão",
    "Sagres", "Vila Nova de Gaia", "Estoril", "Mafra", "Queluz", "Monsaraz",
    "Marvão", "Belmonte", "Serra da Estrela", "Douro Valley", "Alentejo"
  ],
  NL: [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen",
    "Tilburg", "Almere", "Breda", "Nijmegen", "Haarlem", "Maastricht", "Delft",
    "Leiden", "Gouda", "Alkmaar", "Volendam", "Marken", "Zaanse Schans",
    "Keukenhof", "Giethoorn", "Kinderdijk", "Scheveningen", "Texel", "Valkenburg"
  ],
  BE: [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur",
    "Leuven", "Mons", "Mechelen", "Hasselt", "Ostend", "Spa", "Dinant",
    "Bastogne", "Tournai", "Ypres", "Waterloo", "Knokke-Heist", "Durbuy"
  ],
  CH: [
    "Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Lucerne", "St. Gallen",
    "Lugano", "Winterthur", "Zermatt", "Interlaken", "Grindelwald", "Lauterbrunnen",
    "Mürren", "Wengen", "Montreux", "Vevey", "Locarno", "Ascona", "St. Moritz",
    "Davos", "Verbier", "Crans-Montana", "Arosa", "Saas-Fee", "Appenzell",
    "Stein am Rhein", "Schaffhausen", "Rhine Falls", "Brienz", "Thun", "Spiez"
  ],
  AT: [
    "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach",
    "Wels", "St. Pölten", "Hallstatt", "Bad Ischl", "St. Wolfgang", "Zell am See",
    "Kitzbühel", "St. Anton", "Lech", "Seefeld", "Mayrhofen", "Bad Gastein",
    "Melk", "Dürnstein", "Krems", "Wachau Valley", "Eisenstadt", "Bregenz"
  ],
  JP: [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto",
    "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Nara", "Okinawa", "Nikko",
    "Kamakura", "Hakone", "Takayama", "Kanazawa", "Matsumoto", "Nagano",
    "Naoshima", "Miyajima", "Himeji", "Koyasan", "Ise", "Shirakawa-go",
    "Nozawa Onsen", "Niseko", "Furano", "Biei", "Hakodate", "Kagoshima",
    "Kumamoto", "Nagasaki", "Beppu", "Yufuin", "Atami", "Izu", "Shizuoka"
  ],
  CN: [
    "Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu", "Tianjin", "Xi'an",
    "Hangzhou", "Wuhan", "Chongqing", "Hong Kong", "Suzhou", "Nanjing", "Guilin",
    "Yangshuo", "Lijiang", "Dali", "Kunming", "Zhangjiajie", "Huangshan",
    "Macau", "Harbin", "Qingdao", "Xiamen", "Sanya", "Lhasa", "Dunhuang",
    "Luoyang", "Pingyao", "Datong", "Chongqing", "Jiuzhaigou", "Emeishan"
  ],
  KR: [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan",
    "Jeju", "Gyeongju", "Jeonju", "Sokcho", "Gangneung", "Andong", "Suncheon",
    "Yeosu", "Tongyeong", "Geoje", "Namhae", "Boseong", "Damyang"
  ],
  TH: [
    "Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Krabi", "Koh Samui", "Hua Hin",
    "Ayutthaya", "Chiang Rai", "Pai", "Koh Phi Phi", "Koh Lanta", "Koh Tao",
    "Koh Phangan", "Railay Beach", "Ao Nang", "Khao Lak", "Kanchanaburi",
    "Sukhothai", "Lopburi", "Mae Hong Son", "Nan", "Khao Sok", "Koh Chang",
    "Trat", "Koh Samet", "Udon Thani", "Nakhon Ratchasima", "Khon Kaen"
  ],
  VN: [
    "Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho", "Nha Trang",
    "Hue", "Hoi An", "Sa Pa", "Da Lat", "Ha Long Bay", "Ninh Binh", "Phong Nha",
    "Mui Ne", "Phu Quoc", "Cat Ba", "Quy Nhon", "Buon Ma Thuot", "Vinh",
    "Con Dao", "Mekong Delta", "My Son", "Tam Coc", "Mai Chau"
  ],
  ID: [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Bali",
    "Yogyakarta", "Palembang", "Ubud", "Seminyak", "Kuta", "Sanur", "Canggu",
    "Nusa Dua", "Uluwatu", "Nusa Penida", "Nusa Lembongan", "Gili Islands",
    "Lombok", "Komodo", "Labuan Bajo", "Flores", "Lake Toba", "Sumatra",
    "Raja Ampat", "Sulawesi", "Bunaken", "Toraja", "Borobudur", "Solo"
  ],
  MY: [
    "Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam", "Malacca",
    "Kota Kinabalu", "Kuching", "Langkawi", "Cameron Highlands", "Penang Hill",
    "Tioman Island", "Perhentian Islands", "Redang Island", "Sabah", "Sarawak",
    "Taman Negara", "Kinabalu Park", "Semporna", "Sipadan", "Mabul"
  ],
  SG: ["Singapore", "Sentosa Island", "Changi", "Jurong", "Marina Bay"],
  PH: [
    "Manila", "Quezon City", "Davao", "Caloocan", "Cebu City", "Zamboanga",
    "Antipolo", "Boracay", "Palawan", "Baguio", "El Nido", "Coron", "Siargao",
    "Bohol", "Panglao", "Dumaguete", "Siquijor", "Vigan", "Sagada", "Batanes",
    "Puerto Princesa", "Port Barton", "Malapascua", "Apo Island", "Bantayan"
  ],
  IN: [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad",
    "Pune", "Jaipur", "Agra", "Goa", "Varanasi", "Udaipur", "Kerala", "Darjeeling",
    "Jodhpur", "Jaisalmer", "Pushkar", "Rishikesh", "Haridwar", "Amritsar",
    "Shimla", "Manali", "Leh", "Ladakh", "Munnar", "Alleppey", "Kochi", "Hampi",
    "Mysore", "Ooty", "Kodaikanal", "Pondicherry", "Mahabalipuram", "Khajuraho",
    "Orchha", "Bhopal", "Ajanta", "Ellora", "Aurangabad", "Ranthambore"
  ],
  AU: [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra",
    "Newcastle", "Hobart", "Darwin", "Cairns", "Alice Springs", "Uluru",
    "Great Barrier Reef", "Byron Bay", "Port Douglas", "Noosa", "Sunshine Coast",
    "Whitsundays", "Fraser Island", "Kangaroo Island", "Barossa Valley",
    "Margaret River", "Broome", "Kakadu", "Blue Mountains", "Hunter Valley",
    "Phillip Island", "Great Ocean Road", "Tasmania", "Launceston", "Cradle Mountain"
  ],
  NZ: [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin",
    "Queenstown", "Rotorua", "Napier", "Nelson", "Wanaka", "Milford Sound",
    "Fiordland", "Te Anau", "Fox Glacier", "Franz Josef Glacier", "Kaikoura",
    "Abel Tasman", "Tongariro", "Taupo", "Hobbiton", "Waitomo", "Bay of Islands",
    "Coromandel", "Akaroa", "Oamaru", "Stewart Island", "Punakaiki"
  ],
  CA: [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg",
    "Quebec City", "Hamilton", "Victoria", "Halifax", "Niagara Falls", "Banff",
    "Jasper", "Lake Louise", "Whistler", "Tofino", "Kelowna", "Kamloops",
    "Prince Edward Island", "St. John's", "Yellowknife", "Whitehorse", "Churchill",
    "Muskoka", "Thousand Islands", "Mont-Tremblant", "Charlottetown"
  ],
  MX: [
    "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Cancún", "Tijuana",
    "León", "Mérida", "Playa del Carmen", "Oaxaca", "San Miguel de Allende",
    "Guanajuato", "Tulum", "Puerto Vallarta", "Los Cabos", "Cabo San Lucas",
    "San José del Cabo", "Cozumel", "Isla Mujeres", "Holbox", "Bacalar",
    "Palenque", "San Cristóbal de las Casas", "Campeche", "Valladolid",
    "Chichén Itzá", "Taxco", "Querétaro", "Morelia", "Sayulita", "Mazatlán"
  ],
  BR: [
    "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte",
    "Manaus", "Curitiba", "Recife", "Florianópolis", "Iguazu Falls", "Paraty",
    "Búzios", "Ilhabela", "Trancoso", "Porto de Galinhas", "Fernando de Noronha",
    "Jericoacoara", "Lençóis Maranhenses", "Pantanal", "Bonito", "Chapada Diamantina",
    "Ouro Preto", "Olinda", "Porto Alegre", "Gramado", "Campos do Jordão"
  ],
  AR: [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán",
    "Mar del Plata", "Salta", "Bariloche", "Ushuaia", "El Calafate", "El Chaltén",
    "Iguazú", "Purmamarca", "Tilcara", "Cafayate", "Villa La Angostura",
    "San Martín de los Andes", "Puerto Madryn", "Península Valdés", "Colonia del Sacramento"
  ],
  CL: [
    "Santiago", "Valparaíso", "Concepción", "Viña del Mar", "La Serena", "Antofagasta",
    "Punta Arenas", "Puerto Varas", "San Pedro de Atacama", "Torres del Paine",
    "Easter Island", "Chiloé", "Puerto Natales", "Pucón", "Valdivia", "Arica",
    "Iquique", "Elqui Valley", "Carretera Austral", "Puerto Montt"
  ],
  CO: [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga",
    "Santa Marta", "Pereira", "Villa de Leyva", "Salento", "Guatapé", "Tayrona",
    "San Andrés", "Providencia", "Leticia", "Barichara", "Mompox", "Popayán",
    "Tatacoa Desert", "Cocora Valley", "Palomino", "Capurganá", "Manizales"
  ],
  PE: [
    "Lima", "Arequipa", "Trujillo", "Cusco", "Chiclayo", "Piura", "Iquitos",
    "Huancayo", "Machu Picchu", "Sacred Valley", "Ollantaytambo", "Pisac",
    "Aguas Calientes", "Puno", "Lake Titicaca", "Uros Islands", "Colca Canyon",
    "Nazca", "Paracas", "Huacachina", "Máncora", "Huaraz", "Chachapoyas",
    "Kuelap", "Puerto Maldonado", "Manu", "Tambopata"
  ],
  CR: [
    "San José", "Limón", "Alajuela", "Heredia", "Cartago", "Monteverde",
    "Manuel Antonio", "La Fortuna", "Arenal", "Tamarindo", "Puerto Viejo",
    "Cahuita", "Tortuguero", "Drake Bay", "Corcovado", "Osa Peninsula",
    "Santa Teresa", "Nosara", "Samara", "Jacó", "Papagayo", "Guanacaste",
    "Rincón de la Vieja", "Tenorio", "Sarapiquí", "Turrialba", "Playa Conchal",
    "Playa Flamingo", "Playa Hermosa", "Montezuma", "Mal País", "Quepos"
  ],
  ZA: [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein",
    "East London", "Stellenbosch", "Kruger National Park", "Garden Route",
    "Franschhoek", "Paarl", "Knysna", "Plettenberg Bay", "Hermanus", "Oudtshoorn",
    "Addo Elephant Park", "Drakensberg", "Pilanesberg", "Sun City", "Hluhluwe",
    "St. Lucia", "Swaziland", "Lesotho", "Robben Island", "Camps Bay"
  ],
  EG: [
    "Cairo", "Alexandria", "Giza", "Sharm El Sheikh", "Luxor", "Aswan", "Hurghada",
    "Port Said", "Dahab", "Marsa Alam", "Siwa Oasis", "Abu Simbel", "Edfu",
    "Kom Ombo", "Valley of the Kings", "Karnak", "El Gouna", "Nuweiba", "Taba"
  ],
  MA: [
    "Casablanca", "Marrakech", "Fes", "Tangier", "Agadir", "Rabat", "Meknes",
    "Ouarzazate", "Chefchaouen", "Essaouira", "Aït Benhaddou", "Merzouga",
    "Sahara Desert", "Todra Gorge", "Dades Valley", "High Atlas", "Imlil",
    "Taghazout", "Tétouan", "Moulay Idriss", "Volubilis", "Tafraout"
  ],
  KE: [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Masai Mara", "Lamu",
    "Amboseli", "Tsavo", "Lake Nakuru", "Lake Naivasha", "Samburu", "Diani Beach",
    "Malindi", "Watamu", "Mount Kenya", "Hell's Gate", "Ol Pejeta"
  ],
  TZ: [
    "Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar", "Kilimanjaro",
    "Serengeti", "Ngorongoro", "Tarangire", "Lake Manyara", "Stone Town",
    "Jambiani", "Paje", "Nungwi", "Pemba Island", "Mafia Island", "Selous"
  ],
  AE: [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah",
    "Al Ain", "Palm Jumeirah", "Dubai Marina", "Liwa Oasis", "Hatta"
  ],
  SA: [
    "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Abha",
    "Al Ula", "Neom", "Diriyah", "Al Ahsa", "Taif", "Tabuk"
  ],
  TR: [
    "Istanbul", "Ankara", "Izmir", "Antalya", "Bursa", "Adana", "Konya",
    "Gaziantep", "Cappadocia", "Ephesus", "Bodrum", "Fethiye", "Marmaris",
    "Pamukkale", "Ölüdeniz", "Kaş", "Kalkan", "Side", "Alanya", "Dalyan",
    "Selçuk", "Kuşadası", "Çeşme", "Alaçatı", "Göreme", "Ürgüp", "Troy",
    "Gallipoli", "Pergamon", "Safranbolu", "Trabzon", "Mardin", "Şanlıurfa"
  ],
  GR: [
    "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos",
    "Santorini", "Mykonos", "Rhodes", "Corfu", "Crete", "Oia", "Fira",
    "Nafplio", "Delphi", "Meteora", "Olympia", "Zakynthos", "Kefalonia",
    "Naxos", "Paros", "Ios", "Milos", "Hydra", "Aegina", "Skiathos", "Skopelos",
    "Samos", "Kos", "Lefkada", "Parga", "Monemvasia", "Mani", "Chania", "Rethymno"
  ],
  HR: [
    "Zagreb", "Split", "Rijeka", "Dubrovnik", "Osijek", "Zadar", "Pula",
    "Šibenik", "Hvar", "Korčula", "Brač", "Vis", "Rovinj", "Poreč", "Opatija",
    "Trogir", "Makarska", "Bol", "Mljet", "Krka", "Plitvice Lakes", "Istria"
  ],
  CZ: [
    "Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice",
    "Karlovy Vary", "Český Krumlov", "Kutná Hora", "Telč", "Mariánské Lázně",
    "Františkovy Lázně", "Lednice", "Kroměříž", "Litomyšl", "Třeboň"
  ],
  PL: [
    "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin",
    "Bydgoszcz", "Lublin", "Zakopane", "Malbork", "Toruń", "Sopot", "Gdynia",
    "Wieliczka", "Auschwitz", "Częstochowa", "Białowieża", "Masurian Lakes"
  ],
  HU: [
    "Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Eger",
    "Szentendre", "Visegrád", "Esztergom", "Hollókő", "Tokaj", "Lake Balaton",
    "Tihany", "Hévíz", "Sopron", "Villány"
  ],
  RO: [
    "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Sibiu",
    "Sighișoara", "Bran", "Sinaia", "Peleș Castle", "Maramureș", "Transfăgărășan",
    "Transylvania", "Bucovina", "Danube Delta", "Biertan", "Viscri"
  ],
  SE: [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Kiruna",
    "Visby", "Lund", "Helsingborg", "Kalmar", "Åre", "Abisko", "Lapland",
    "Dalarna", "Marstrand", "Ystad", "Sigtuna"
  ],
  NO: [
    "Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Tromsø",
    "Ålesund", "Lofoten", "Geiranger", "Flåm", "Sognefjord", "Hardangerfjord",
    "Preikestolen", "Trolltunga", "Svalbard", "Nordkapp", "Hammerfest",
    "Bodø", "Røros", "Lillehammer", "Kristiansand"
  ],
  DK: [
    "Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers",
    "Helsingør", "Roskilde", "Skagen", "Ribe", "Legoland", "Bornholm", "Fanø"
  ],
  FI: [
    "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Rovaniemi",
    "Lapland", "Saariselkä", "Levi", "Porvoo", "Savonlinna", "Naantali",
    "Lake District", "Åland Islands", "Kuopio", "Jyväskylä"
  ],
  IE: [
    "Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Killarney",
    "Ring of Kerry", "Cliffs of Moher", "Dingle", "Kilkenny", "Wicklow",
    "Connemara", "Aran Islands", "Blarney", "Kinsale", "Cobh", "Sligo",
    "Westport", "Doolin", "Belfast", "Giant's Causeway"
  ],
  IS: [
    "Reykjavik", "Akureyri", "Keflavík", "Selfoss", "Vik", "Húsavík",
    "Blue Lagoon", "Golden Circle", "Gullfoss", "Geysir", "Thingvellir",
    "Jökulsárlón", "Skógafoss", "Seljalandsfoss", "Snæfellsnes", "Myvatn",
    "Westfjords", "Landmannalaugar", "Höfn"
  ],
  RU: [
    "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan",
    "Nizhny Novgorod", "Sochi", "Vladivostok", "Kaliningrad", "Golden Ring",
    "Suzdal", "Vladimir", "Sergiev Posad", "Lake Baikal", "Irkutsk"
  ],
  IL: [
    "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Eilat",
    "Be'er Sheva", "Nazareth", "Dead Sea", "Masada", "Acre", "Jaffa", "Tiberias",
    "Sea of Galilee", "Caesarea", "Golan Heights", "Negev Desert"
  ],
  JO: [
    "Amman", "Irbid", "Zarqa", "Aqaba", "Petra", "Wadi Rum", "Dead Sea",
    "Jerash", "Madaba", "Mount Nebo", "Ajloun", "Kerak", "Dana"
  ],
  LK: [
    "Colombo", "Kandy", "Galle", "Negombo", "Jaffna", "Ella", "Sigiriya",
    "Anuradhapura", "Polonnaruwa", "Dambulla", "Nuwara Eliya", "Adam's Peak",
    "Yala", "Mirissa", "Unawatuna", "Hikkaduwa", "Trincomalee", "Arugam Bay"
  ],
  NP: [
    "Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Chitwan",
    "Bhaktapur", "Patan", "Lumbini", "Everest Base Camp", "Annapurna",
    "Nagarkot", "Bandipur", "Tansen", "Janakpur"
  ],
  MM: [
    "Yangon", "Mandalay", "Naypyidaw", "Bagan", "Inle Lake", "Ngapali",
    "Kalaw", "Hsipaw", "Mrauk U", "Golden Rock", "Hpa-An"
  ],
  KH: [
    "Phnom Penh", "Siem Reap", "Sihanoukville", "Battambang", "Kampot",
    "Angkor Wat", "Koh Rong", "Koh Rong Samloem", "Kep", "Kratie"
  ],
  LA: [
    "Vientiane", "Luang Prabang", "Pakse", "Savannakhet", "Vang Vieng",
    "4000 Islands", "Bolaven Plateau", "Plain of Jars", "Nong Khiaw"
  ],
  CU: [
    "Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara", "Trinidad",
    "Varadero", "Viñales", "Cienfuegos", "Baracoa", "Remedios", "Cayo Coco",
    "Cayo Largo", "Playa Girón", "Guardalavaca"
  ],
  JM: [
    "Kingston", "Montego Bay", "Spanish Town", "Portmore", "Ocho Rios", "Negril",
    "Port Antonio", "Blue Mountains", "Treasure Beach", "Falmouth", "Runaway Bay"
  ],
  DO: [
    "Santo Domingo", "Santiago de los Caballeros", "Punta Cana", "La Romana",
    "Puerto Plata", "Samaná", "Las Terrenas", "Bayahibe", "Cabarete", "Jarabacoa",
    "Constanza", "Barahona"
  ],
  PA: [
    "Panama City", "Colón", "David", "Bocas del Toro", "Boquete",
    "San Blas Islands", "Pearl Islands", "Santa Catalina", "El Valle de Antón"
  ],
  EC: [
    "Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Galápagos Islands",
    "Baños", "Otavalo", "Montañita", "Mindo", "Cotopaxi", "Quilotoa",
    "Amazon Rainforest", "Puerto López", "Tena"
  ],
  BO: [
    "La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro", "Uyuni",
    "Salar de Uyuni", "Lake Titicaca", "Copacabana", "Potosí", "Rurrenabaque",
    "Death Road", "Tiwanaku"
  ],
  UY: [
    "Montevideo", "Salto", "Ciudad de la Costa", "Paysandú", "Punta del Este",
    "Colonia del Sacramento", "Cabo Polonio", "La Paloma", "Carmelo"
  ],
  PY: [
    "Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Encarnación",
    "Areguá", "San Bernardino", "Trinidad", "Yguazú"
  ],
  GT: [
    "Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "Antigua Guatemala",
    "Flores", "Tikal", "Lake Atitlán", "Panajachel", "Chichicastenango",
    "Semuc Champey", "Livingston", "Cobán"
  ],
  HN: [
    "Tegucigalpa", "San Pedro Sula", "La Ceiba", "Roatán", "Copán",
    "Utila", "Guanaja", "Tela", "Trujillo", "Comayagua"
  ],
  NI: [
    "Managua", "León", "Masaya", "Matagalpa", "Granada", "San Juan del Sur",
    "Ometepe Island", "Corn Islands", "Estelí", "Bluefields"
  ],
  SV: [
    "San Salvador", "Santa Ana", "San Miguel", "Mejicanos", "Suchitoto",
    "Ruta de las Flores", "El Tunco", "Juayúa", "Apaneca"
  ],
  BZ: [
    "Belize City", "San Ignacio", "Belmopan", "Orange Walk", "Placencia", "Ambergris Caye",
    "Caye Caulker", "Hopkins", "Dangriga", "Corozal", "Punta Gorda"
  ],
  QA: [
    "Doha", "Al Wakrah", "Al Khor", "Al Rayyan", "Souq Waqif", "The Pearl"
  ],
  BH: [
    "Manama", "Riffa", "Muharraq", "Isa Town", "Bahrain Fort"
  ],
  KW: [
    "Kuwait City", "Al Ahmadi", "Hawalli", "Salmiya", "Failaka Island"
  ],
  OM: [
    "Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Wahiba Sands", "Jebel Akhdar",
    "Musandam Peninsula", "Jebel Shams", "Masirah Island"
  ],
  LB: [
    "Beirut", "Tripoli", "Sidon", "Byblos", "Baalbek", "Jounieh", "Tyre",
    "Cedars of Lebanon", "Jeita Grotto", "Batroun"
  ],
  MT: [
    "Valletta", "Sliema", "Birkirkara", "Mosta", "Mdina", "Gozo", "Comino",
    "St. Julian's", "Marsaxlokk", "Blue Lagoon"
  ],
  CY: [
    "Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia",
    "Ayia Napa", "Protaras", "Troodos Mountains"
  ],
  LU: [
    "Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange",
    "Echternach", "Vianden", "Clervaux", "Mullerthal"
  ],
  MC: [
    "Monaco", "Monte Carlo", "La Condamine", "Fontvieille"
  ],
  AD: [
    "Andorra la Vella", "Escaldes-Engordany", "Encamp", "Grandvalira", "Vallnord"
  ],
  SM: [
    "San Marino", "Serravalle", "Borgo Maggiore", "Monte Titano"
  ],
  VA: [
    "Vatican City", "St. Peter's Basilica", "Vatican Museums"
  ],
  LI: [
    "Vaduz", "Schaan", "Balzers", "Triesenberg", "Malbun"
  ],
  MV: [
    "Malé", "Addu City", "Hulhumalé", "Maafushi", "Baa Atoll", "Ari Atoll"
  ],
  MU: [
    "Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Grand Baie",
    "Flic en Flac", "Le Morne", "Trou aux Biches", "Chamarel"
  ],
  SC: [
    "Victoria", "Anse Royale", "Beau Vallon", "Praslin", "La Digue", "Anse Lazio"
  ],
  FJ: [
    "Suva", "Nadi", "Lautoka", "Labasa", "Denarau", "Mamanuca Islands", "Yasawa Islands"
  ],
  PF: [
    "Papeete", "Faaa", "Bora Bora", "Moorea", "Tahiti", "Rangiroa", "Huahine"
  ],
  NC: [
    "Nouméa", "Mont-Dore", "Dumbéa", "Isle of Pines", "Lifou"
  ],
  WS: [
    "Apia", "Vaitele", "Faleula", "Lalomanu Beach", "To Sua Ocean Trench"
  ],
  TO: [
    "Nukuʻalofa", "Neiafu", "Haveluloto", "Vava'u", "Ha'apai"
  ],
  VU: [
    "Port Vila", "Luganville", "Tanna", "Espiritu Santo", "Efate"
  ],
  PG: [
    "Port Moresby", "Lae", "Mount Hagen", "Goroka", "Rabaul", "Tufi"
  ],
  // Additional countries with expanded city lists
  SI: [
    "Ljubljana", "Maribor", "Celje", "Kranj", "Bled", "Piran", "Portorož",
    "Postojna", "Koper", "Bovec", "Kranjska Gora"
  ],
  SK: [
    "Bratislava", "Košice", "Prešov", "Žilina", "Banská Bystrica",
    "High Tatras", "Levoča", "Spišský hrad"
  ],
  BG: [
    "Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Veliko Tarnovo",
    "Bansko", "Sunny Beach", "Sozopol", "Rila Monastery"
  ],
  RS: [
    "Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zlatibor", "Kopaonik"
  ],
  ME: [
    "Podgorica", "Budva", "Kotor", "Herceg Novi", "Tivat", "Ulcinj", "Cetinje"
  ],
  AL: [
    "Tirana", "Durrës", "Vlorë", "Shkodër", "Berat", "Gjirokastër", "Sarandë",
    "Ksamil", "Albanian Riviera", "Theth"
  ],
  MK: [
    "Skopje", "Bitola", "Kumanovo", "Ohrid", "Lake Ohrid", "Mavrovo"
  ],
  XK: [
    "Pristina", "Prizren", "Peja", "Gjakova", "Rugova Valley"
  ],
  BA: [
    "Sarajevo", "Banja Luka", "Tuzla", "Mostar", "Medjugorje", "Travnik", "Jajce"
  ],
  EE: [
    "Tallinn", "Tartu", "Narva", "Pärnu", "Kuressaare", "Lahemaa"
  ],
  LV: [
    "Riga", "Daugavpils", "Liepāja", "Jūrmala", "Sigulda", "Cēsis", "Rundale"
  ],
  LT: [
    "Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Trakai", "Nida", "Curonian Spit"
  ],
  UA: [
    "Kyiv", "Lviv", "Odessa", "Kharkiv", "Dnipro", "Chernobyl", "Carpathian Mountains"
  ],
  BY: [
    "Minsk", "Brest", "Grodno", "Gomel", "Vitebsk", "Mir Castle"
  ],
  MD: [
    "Chișinău", "Tiraspol", "Bălți", "Orheiul Vechi", "Cricova"
  ],
  GE: [
    "Tbilisi", "Batumi", "Kutaisi", "Mtskheta", "Kazbegi", "Svaneti", "Sighnaghi"
  ],
  AM: [
    "Yerevan", "Gyumri", "Vanadzor", "Dilijan", "Lake Sevan", "Tatev", "Noravank"
  ],
  AZ: [
    "Baku", "Ganja", "Sumqayit", "Sheki", "Quba", "Gobustan", "Gabala"
  ],
};

// Get cities for a country by country code
export const getCitiesForCountry = (countryCode: string): string[] => {
  return citiesByCountry[countryCode.toUpperCase()] || [];
};

// Search cities within a country
export const searchCitiesInCountry = (countryCode: string, query: string): string[] => {
  const cities = getCitiesForCountry(countryCode);
  if (!query) return cities;
  
  const lowercaseQuery = query.toLowerCase();
  return cities.filter(city => city.toLowerCase().includes(lowercaseQuery));
};

// Check if a country has cities data
export const hasCountryCities = (countryCode: string): boolean => {
  return countryCode.toUpperCase() in citiesByCountry;
};