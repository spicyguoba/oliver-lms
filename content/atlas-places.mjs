// Original learning cues; ISO numeric IDs join to Natural Earth map geometry.
export const CONTINENTS = [
  ["africa", "Africa", "The Sahara is a vast desert in northern Africa."],
  [
    "antarctica",
    "Antarctica",
    "Antarctica surrounds the South Pole and has no countries.",
  ],
  ["asia", "Asia", "Asia is the largest continent by land area."],
  [
    "europe",
    "Europe",
    "Europe and Asia share one connected landmass called Eurasia.",
  ],
  [
    "north-america",
    "North America",
    "North America includes Canada, the United States, Mexico and more.",
  ],
  [
    "south-america",
    "South America",
    "The Andes form a long mountain chain in western South America.",
  ],
  [
    "australia",
    "Australia",
    "Australia is a continent; Oceania is a wider region of Pacific lands.",
  ],
].map(([id, name, fact]) => ({ id, name, fact }));
export const COUNTRY_REGIONS = [
  ["africa", "Africa", "🦒"],
  ["asia", "Asia", "🐼"],
  ["europe", "Europe", "🏰"],
  ["north-america", "North America", "🦬"],
  ["south-america", "South America", "🦜"],
  ["oceania", "Oceania", "🪸"],
].map(([id, name, icon]) => ({ id, name, icon }));
const countryRows = {
  "north-america": `
840|United States|Washington, D.C.|The Grand Canyon is a huge canyon in Arizona.
124|Canada|Ottawa|Canada has land beside the Atlantic, Pacific and Arctic oceans.
484|Mexico|Mexico City|The ancient Maya city of Chichén Itzá is in Mexico.
320|Guatemala|Guatemala City|Guatemala contains the ancient Maya city of Tikal.
188|Costa Rica|San José|Costa Rica protects tropical forests and is home to sloths.
192|Cuba|Havana|Cuba is the largest island in the Caribbean.
332|Haiti|Port-au-Prince|Haiti shares the island of Hispaniola with the Dominican Republic.
214|Dominican Republic|Santo Domingo|The Dominican Republic occupies the eastern part of Hispaniola.
591|Panama|Panama City|The Panama Canal provides a route between two oceans.
388|Jamaica|Kingston|Jamaica is the Caribbean island where reggae music developed.
`,
  "south-america": `
032|Argentina|Buenos Aires|Patagonia stretches across southern Argentina and Chile.
068|Bolivia|Sucre|Sucre is Bolivia's constitutional capital; government also works in La Paz.
076|Brazil|Brasília|Brazil contains a large part of the Amazon rainforest.
152|Chile|Santiago|Chile is a long, narrow country beside the Pacific Ocean.
170|Colombia|Bogotá|Colombia has coasts on both the Pacific and the Caribbean.
218|Ecuador|Quito|The equator crosses Ecuador; the Galápagos Islands belong to it.
328|Guyana|Georgetown|Guyana is the only mainland South American country with English as its official language.
600|Paraguay|Asunción|Paraguay is a landlocked country with no ocean coast.
604|Peru|Lima|Peru contains the Inca site of Machu Picchu.
858|Uruguay|Montevideo|Uruguay lies between Argentina and Brazil on the Atlantic side.
862|Venezuela|Caracas|Angel Falls, a very tall waterfall, is in Venezuela.
`,
  europe: `
826|United Kingdom|London|The United Kingdom includes England, Scotland, Wales and Northern Ireland.
250|France|Paris|The Eiffel Tower stands in Paris, France.
276|Germany|Berlin|The Rhine is one of Germany's important rivers.
380|Italy|Rome|Italy has a peninsula often described as boot-shaped.
724|Spain|Madrid|Spain and Portugal share the Iberian Peninsula.
620|Portugal|Lisbon|Portugal lies on the Atlantic side of the Iberian Peninsula.
372|Ireland|Dublin|The country of Ireland occupies most of the island of Ireland.
528|Netherlands|Amsterdam|Amsterdam is the capital; the Dutch government works in The Hague.
056|Belgium|Brussels|Belgium has Dutch, French and German as official languages.
756|Switzerland|Bern|Bern is Switzerland's federal city; the Alps cross the country.
040|Austria|Vienna|Vienna is known for its long tradition of classical music.
616|Poland|Warsaw|The Vistula River flows through Poland.
203|Czechia|Prague|Prague is known for its historic Charles Bridge.
300|Greece|Athens|Ancient Olympic Games took place in Greece.
752|Sweden|Stockholm|Sweden occupies part of the Scandinavian Peninsula.
578|Norway|Oslo|Norway's coast is known for deep sea inlets called fjords.
246|Finland|Helsinki|Finland has many lakes and extensive forests.
208|Denmark|Copenhagen|Denmark includes the Jutland Peninsula and many islands.
804|Ukraine|Kyiv|The Dnipro River flows through Ukraine and its capital.
643|Russia|Moscow|Russia stretches across both Europe and Asia.
352|Iceland|Reykjavík|Iceland has volcanoes, glaciers and hot springs.
`,
  asia: `
156|China|Beijing|The Great Wall extends across parts of northern China.
356|India|New Delhi|The Taj Mahal is a famous building in Agra, India.
392|Japan|Tokyo|Japan is an island country; Mount Fuji is its highest mountain.
410|South Korea|Seoul|South Korea occupies the southern part of the Korean Peninsula.
408|North Korea|Pyongyang|North Korea occupies the northern part of the Korean Peninsula.
496|Mongolia|Ulaanbaatar|Mongolia has wide grasslands and part of the Gobi Desert.
360|Indonesia|Jakarta (capital transition)|Indonesia is building Nusantara as a new capital; Jakarta continues in a transitional role.
608|Philippines|Manila|The Philippines is an archipelago in the western Pacific Ocean.
704|Vietnam|Hanoi|Vietnam's long coast runs beside the South China Sea.
764|Thailand|Bangkok|Thailand is the Southeast Asian country whose capital is Bangkok.
458|Malaysia|Kuala Lumpur|Kuala Lumpur is the capital; Putrajaya is the administrative center.
702|Singapore|Singapore|Singapore is both a city and an island country.
050|Bangladesh|Dhaka|Bangladesh contains part of the large Ganges-Brahmaputra river delta.
586|Pakistan|Islamabad|The Indus River is an important river in Pakistan.
524|Nepal|Kathmandu|Mount Everest lies on the border of Nepal and China.
144|Sri Lanka|Sri Jayawardenepura Kotte|Sri Lanka is an island south of India; Colombo also has government offices.
364|Iran|Tehran|Iran was historically known to many outsiders as Persia.
368|Iraq|Baghdad|The Tigris and Euphrates rivers cross Iraq.
682|Saudi Arabia|Riyadh|Saudi Arabia occupies much of the Arabian Peninsula.
792|Türkiye|Ankara|Türkiye spans parts of Europe and Asia.
400|Jordan|Amman|The ancient rock-cut city of Petra is in Jordan.
004|Afghanistan|Kabul|The Hindu Kush mountains cross Afghanistan.
398|Kazakhstan|Astana|Kazakhstan is the world's largest landlocked country.
860|Uzbekistan|Tashkent|Samarkand in Uzbekistan was an important Silk Road city.
`,
  africa: `
818|Egypt|Cairo|The Nile River and the pyramids of Giza are in Egypt.
504|Morocco|Rabat|Morocco is in northwest Africa beside the Atlantic and Mediterranean.
012|Algeria|Algiers|Algeria is Africa's largest country by land area.
788|Tunisia|Tunis|Tunisia contains the ruins of the ancient city of Carthage.
686|Senegal|Dakar|Senegal is on the western Atlantic coast of Africa.
288|Ghana|Accra|Ghana was historically associated with the name Gold Coast.
566|Nigeria|Abuja|Nigeria has the largest population of any African country.
120|Cameroon|Yaoundé|Cameroon has tropical forests, grasslands and the volcano Mount Cameroon.
180|Democratic Republic of the Congo|Kinshasa|The Congo River forms a major waterway in this large central African country.
404|Kenya|Nairobi|Kenya is known for savannas and wildlife such as elephants and giraffes.
800|Uganda|Kampala|Uganda shares Lake Victoria with Kenya and Tanzania.
834|Tanzania|Dodoma|Mount Kilimanjaro, Africa's highest mountain, is in Tanzania.
231|Ethiopia|Addis Ababa|Ethiopia has highlands and the ancient rock-cut churches of Lalibela.
710|South Africa|Pretoria|Pretoria is the executive capital; Cape Town and Bloemfontein have other capital roles.
450|Madagascar|Antananarivo|Madagascar is an island with many kinds of lemurs.
508|Mozambique|Maputo|Mozambique has a long coast beside the Indian Ocean.
894|Zambia|Lusaka|Zambia shares Victoria Falls with Zimbabwe.
716|Zimbabwe|Harare|Zimbabwe is home to the stone ruins of Great Zimbabwe.
516|Namibia|Windhoek|The Namib Desert runs along much of Namibia's Atlantic coast.
072|Botswana|Gaborone|Botswana contains the Okavango Delta, an inland wetland.
`,
  oceania: `
036|Australia|Canberra|Australia is both a country and the name of a continent.
554|New Zealand|Wellington|New Zealand's two largest islands are the North and South islands.
598|Papua New Guinea|Port Moresby|Papua New Guinea occupies the eastern part of New Guinea.
242|Fiji|Suva|Fiji is a Pacific island country with more than 300 islands.
090|Solomon Islands|Honiara|The Solomon Islands form a Pacific island chain east of Papua New Guinea.
548|Vanuatu|Port Vila|Vanuatu is a Pacific island country with active volcanoes.
882|Samoa|Apia|Samoa is an independent country in the Polynesian region of the Pacific.
776|Tonga|Nukuʻalofa|Tonga is a Pacific island kingdom in Polynesia.
`,
};
export const COUNTRIES = Object.entries(countryRows).flatMap(([region, rows]) =>
  rows
    .trim()
    .split("\n")
    .map((row) => {
      const [id, name, capital, fact] = row.split("|");
      return { id, name, capital, fact, region };
    }),
);
export const STATE_FACTS = `
Alabama|Huntsville is home to the U.S. Space and Rocket Center.
Alaska|Alaska is the largest U.S. state by land area.
Arizona|The Grand Canyon is in Arizona.
Arkansas|Arkansas has a state park where visitors can search for diamonds.
California|California contains the tall coast redwood trees.
Colorado|Colorado is known for its Rocky Mountain peaks.
Connecticut|Connecticut is one of the six New England states.
Delaware|Delaware was the first state to ratify the U.S. Constitution.
Florida|The Everglades wetland is in southern Florida.
Georgia|Georgia's capital Atlanta hosted the 1996 Summer Olympics.
Hawaii|Hawaii is the only U.S. state made entirely of islands.
Idaho|Idaho is known for growing potatoes.
Illinois|Chicago, beside Lake Michigan, is in Illinois.
Indiana|The Indianapolis 500 motor race takes place in Indiana.
Iowa|Iowa lies between the Missouri and Mississippi rivers.
Kansas|Kansas is known for its wheat fields on the Great Plains.
Kentucky|Mammoth Cave is part of a very long cave system in Kentucky.
Louisiana|New Orleans, an important city in jazz history, is in Louisiana.
Maine|Maine is the northeasternmost U.S. state.
Maryland|Maryland borders much of the Chesapeake Bay.
Massachusetts|Boston and the Plymouth settlement are in Massachusetts.
Michigan|Michigan has two large peninsulas beside the Great Lakes.
Minnesota|Minnesota is nicknamed the Land of 10,000 Lakes.
Mississippi|The Mississippi Delta region is known for blues music.
Missouri|The Gateway Arch is in St. Louis, Missouri.
Montana|Glacier National Park is in Montana.
Nebraska|Nebraska contains a large region of grassy sand dunes called the Sandhills.
Nevada|Much of Nevada lies in the dry Great Basin region.
New Hampshire|Mount Washington is in New Hampshire's White Mountains.
New Jersey|New Jersey lies between the Hudson and Delaware rivers.
New Mexico|White Sands National Park is in New Mexico.
New York|The Statue of Liberty stands in New York Harbor.
North Carolina|The Wright brothers' first powered flights took place in North Carolina.
North Dakota|Theodore Roosevelt National Park is in North Dakota.
Ohio|The National Museum of the U.S. Air Force is near Dayton, Ohio.
Oklahoma|Oklahoma has land in the Great Plains and is home to many Tribal Nations.
Oregon|Crater Lake, formed in a volcanic basin, is in Oregon.
Pennsylvania|The Declaration of Independence was adopted in Philadelphia, Pennsylvania.
Rhode Island|Rhode Island is the smallest U.S. state by area.
South Carolina|Fort Sumter is in Charleston Harbor, South Carolina.
South Dakota|The Black Hills and Badlands are in South Dakota.
Tennessee|Nashville is known as an important center of country music.
Texas|Texas is the largest state in the contiguous United States.
Utah|Utah has five national parks, including Zion and Arches.
Vermont|Vermont is known for its Green Mountains and maple syrup.
Virginia|Richmond is Virginia's capital; Jamestown was founded in Virginia in 1607.
Washington|Mount Rainier is a volcano in Washington state.
West Virginia|West Virginia is known for Appalachian mountains and deep river valleys.
Wisconsin|Wisconsin is known for dairy farming and cheese making.
Wyoming|Most of Yellowstone National Park lies in Wyoming.
`
  .trim()
  .split("\n")
  .map((row) => row.split("|"));
