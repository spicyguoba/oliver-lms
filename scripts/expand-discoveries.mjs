// Original lessons and questions. Regenerate only this additive catalog;
// never change IDs or the existing discoveries/story catalogs to update it.
import fs from "node:fs";
const topics=[];
function topic(id,title,subject,icon,description,lesson,tryIt,sources,rows){
 topics.push({id,title,subject,icon,description,lesson,tryIt,sources,questions:rows.trim().split('\n').map(line=>{const[prompt,right,wrong1,wrong2,explanation]=line.split('|');return{prompt,options:[right,wrong1,wrong2],answer:0,explanation};})});
}
topic('plant-life','Seed to sunflower','Science','🌻','Follow roots, leaves, flowers, and seeds.',[
 'A seed contains a tiny plant and stored food. Many seeds need water, suitable warmth, and air to germinate.',
 'Roots anchor a plant and take in water. Leaves use light to help make food; flowers can develop seeds.',
 'Plants have different life cycles. Observe a real plant over time rather than expecting every seed to grow at the same speed.'
],'With a grown-up, grow a bean in a clear cup. Draw what changes; keep it moist rather than flooded.',['https://www.fs.usda.gov/wildflowers/kids/activities/surprisegarden.shtml'],`
What usually grows from a seed first?|A root|A wooden chair|A fully grown flower|A root often emerges first and grows into the moist growing material.
Which part usually anchors a plant in soil?|Roots|Petals|Fruit skin|Roots help hold the plant in place.
Which part mainly captures light to help make food?|Leaves|Only dry seeds|Only bark|Leaves usually capture light for photosynthesis.
What can a flower help a plant make?|Seeds|Metal|Plastic|Flowers are involved in reproduction and can lead to seeds.
Why should a bean seed not be left completely dry?|It needs water to start growing|Dryness gives it extra water|Seeds never use water|Water helps start the changes of germination.
Which is a good way to observe growth?|Draw and measure the same plant over several days|Guess once and never look again|Change every condition without keeping notes|Repeated observations show how a plant changes.
A seedling bends toward a bright window. What is it responding to?|Light|The color of your shoes|A map of the ocean|Plant growth can respond to light.
Which statement respects differences between plants?|Different plants can need different conditions|Every plant grows at exactly the same speed|All plants live only in deserts|Plants differ in their needs and life cycles.
`);
topic('water-journey','Water’s round trip','Science','💧','Follow water through air, land, and oceans.',[
 'Water moves among oceans, air, land, and living things. The Sun provides energy that helps water evaporate.',
 'Evaporation changes liquid water to vapor. Condensation changes vapor to liquid droplets; clouds contain tiny droplets or ice crystals.',
 'Rain and snow are precipitation. Water can flow over land, soak into soil, or collect in lakes and oceans.'
],'Watch a small dish of water over several days with a grown-up. Mark its level and discuss evaporation.',['https://www.usgs.gov/water-science-school/water-cycle'],`
What is liquid water changing to vapor called?|Evaporation|Freezing|Drawing|Evaporation changes liquid water at its surface into vapor.
What is vapor changing to liquid droplets called?|Condensation|Multiplication|Erosion|Condensation forms liquid droplets from vapor.
Which is precipitation?|Rain falling from clouds|A dry pebble on a shelf|A written weather report|Rain is one kind of precipitation.
What provides much of the energy driving the water cycle?|The Sun|A paper map|The Moon’s own light|Sunlight supplies energy that helps water evaporate.
After rain, water soaks into soil. Where has it gone?|Into spaces in the ground|Out of existence|Into solid metal|Water can enter spaces in soil and rock.
Which cloud description is correct?|Tiny water droplets or ice crystals|Only cotton wool|Only empty blue sky|Clouds contain small droplets or ice crystals.
What can happen to a puddle on a warm day?|It gets smaller as water evaporates|It must turn into a mountain|Its water is destroyed forever|Water can leave a puddle as vapor.
Why is this called a cycle?|Water moves through repeating connected processes|It happens once and ends forever|Water never changes location|Water keeps moving among connected stores and processes.
`);
topic('matter-makers','Matter makers','Science','🧊','Explore solids, liquids, gases, and mixtures.',[
 'Matter takes up space and has mass. A solid keeps its shape; a liquid flows to fit its container; a gas spreads out.',
 'Melting changes a solid to a liquid. Freezing changes a liquid to a solid. Water vapor is invisible.',
 'A mixture combines materials. Dissolved salt is still in salt water even when you cannot see separate grains.'
],'With a grown-up, compare an ice cube and liquid water in containers. Never taste unknown materials.',['https://www.usgs.gov/special-topics/water-science-school/science/water-properties-information-topic'],`
Which is a solid at normal room temperature?|A wooden block|A cup of water|Air in a balloon|A wooden block keeps its own shape.
Which material flows and takes the shape of its cup?|Liquid water|A stone|A wooden cube|Liquid water flows to fit the container.
Which spreads out to fill an available container?|A gas|A brick|A pencil|Gases spread through the available space.
An ice cube becomes liquid water. What happened?|Melting|Freezing|Sewing|Melting changes solid ice to liquid water.
Liquid water becomes ice. What happened?|Freezing|Melting|Cutting|Freezing changes liquid water to solid ice.
Salt seems to disappear after stirring in water. Which is true?|It is dissolved in the water|It has stopped existing|It turned into a wooden block|The salt particles are spread through the solution.
Which is a mixture?|Sand and pebbles together|Only one pure substance by definition|An empty drawing of a bowl|Sand and pebbles can be combined in a mixture.
Why can a balloon expand when you blow into it?|Air takes up space inside it|Air has no effect at all|Rubber creates new air by itself|Air is matter and takes up space.
`);
topic('light-sound','Light & sound studio','Science','🔦','Use reflections, shadows, and vibrations.',[
 'Light lets us see. A shadow forms where an object blocks light, while a mirror reflects light.',
 'Sound starts with vibration and travels through materials such as air, water, and solids.',
 'Pitch describes high or low sound; volume describes loud or quiet sound. Keep listening volumes comfortable.'
],'With a grown-up, use a flashlight and a toy to make shadows. Pluck a rubber band gently and observe its vibration.',['https://science.nasa.gov/resource/exploring-earth-bears-shadow/','https://www.nasa.gov/wp-content/uploads/2009/07/350541main_optics_reflection_light_plane_mirror.pdf','https://www.nidcd.nih.gov/health/how-do-we-hear'],`
What makes a shadow?|An object blocking light|A mirror adding food|A sound becoming a rock|A shadow forms where light is blocked.
What does a mirror do to light?|Reflects it|Turns it into a plant|Uses it as water|A mirror reflects light toward our eyes.
What begins a sound?|A vibration|A perfectly still silent object alone|A color on a map|Vibration starts sound waves in a material.
What describes a sound as high or low?|Pitch|Temperature|Perimeter|Pitch is how high or low a sound seems.
What describes a sound as loud or quiet?|Volume|Latitude|Area|Volume describes loudness.
Can sound travel through water?|Yes|Only through empty space|No material can carry sound|Sound can travel through water as well as air and solids.
Which object usually lets you see clearly through it?|Clear glass|Opaque cardboard|A thick wooden board|Transparent glass transmits light clearly.
How should we protect our ears while listening?|Keep volume comfortable and take breaks|Always use the loudest setting|Move closer to very loud speakers|Comfortable volume helps protect hearing.
`);
const geo=['https://education.nationalgeographic.org/resource/Continent/'];
topic('africa-trip','Across Africa','Geography','🦒','Meet varied landscapes and countries.',[
 'Africa is a continent with many countries, languages, cities, and ways of life. One picture cannot represent everyone.',
 'The Sahara is a large desert in northern Africa. Other African regions include forests, grasslands, mountains, and lakes.',
 'Egypt, Kenya, Nigeria, and South Africa are countries in Africa. Learn a specific place before making claims about a whole continent.'
],'Find four African countries on an atlas. Compare one city and one natural landscape without treating them as everyone’s life.',geo,`
Africa is best described as what?|A continent with many countries|One single country|A single city|Africa contains many countries and communities.
Where is the Sahara?|Northern Africa|Antarctica|Virginia|The Sahara lies across much of northern Africa.
Which country is in Africa?|Kenya|Japan|Peru|Kenya is in eastern Africa.
Which of these is a country in western Africa?|Nigeria|Canada|Sweden|Nigeria is in western Africa.
Which African country is strongly connected with the Nile and ancient pyramids?|Egypt|Brazil|New Zealand|Egypt lies in northeastern Africa along the Nile.
Which statement is fair and accurate?|Africa has many different languages and cultures|Everyone in Africa speaks one language|Every African home is the same|People and places across Africa are diverse.
Which landscape can be found in Africa?|Mountains, forests, grasslands, and deserts|Only one endless desert|Only permanent ice with no cities|Africa has varied environments as well as large cities.
Which question helps us learn respectfully?|What is life like in this particular place?|Why is everyone on the continent identical?|Can one photograph explain every person?|Specific questions avoid making everyone seem the same.
`);
topic('asia-trip','Across Asia','Geography','🏔️','Explore countries, mountains, and islands.',[
 'Asia is Earth’s largest continent by land area. It has many countries and languages; China, India, and Japan are examples.',
 'The Himalayas form a great mountain range. Japan is an island country, while many Asian countries have large mainland areas.',
 'People within one country can have different traditions, languages, and everyday lives.'
],'Find China, India, Japan, and the Himalayas in an atlas. Compare the shapes of an island country and a mainland country.',['https://education.nationalgeographic.org/resource/asia/'],`
Which is Earth’s largest continent by land area?|Asia|Australia|Europe|Asia is the largest continent by land area.
Which country is in Asia?|India|Argentina|Norway|India is in southern Asia.
Which Asian country is made up of islands?|Japan|Bolivia|Virginia|Japan is an island country in eastern Asia.
Which mountain range is in Asia?|The Himalayas|The Blue Ridge only|The Andes|The Himalayas rise across parts of southern Asia.
Where is China?|Asia|South America|Antarctica|China is a country in Asia.
Which statement about Asia is true?|It has many countries and languages|It has only one language|Every person has the same daily routine|Asia is home to very diverse communities.
What surrounds an island?|Water|Only other land on every side|Only desert sand|An island is surrounded by water.
What is a respectful way to explore a culture?|Learn specific examples and remember people vary|Assume every family does the same thing|Judge people by one food|Specific examples help without treating a whole population as identical.
`);
topic('europe-trip','Across Europe','Geography','🏰','Find countries, peninsulas, and landmarks.',[
 'Europe has many countries, languages, and histories. France, Germany, Italy, and Greece are examples.',
 'The Alps are a mountain range. Italy extends into the Mediterranean as a peninsula, which is mostly surrounded by water.',
 'Historic buildings stand beside modern homes, schools, and workplaces. People living in Europe today have varied backgrounds.'
],'Locate four European countries. Find the Mediterranean Sea and compare a peninsula with an island.',geo,`
Which country is in Europe?|France|Kenya|Peru|France is a country in Europe.
Which of these European countries includes Berlin?|Germany|Japan|Chile|Germany is in Europe, and Berlin is its capital.
Which country extends into the Mediterranean as a peninsula?|Italy|Mongolia|Bolivia|Much of Italy is a peninsula in the Mediterranean.
Which mountain range is in Europe?|The Alps|The Andes|The Himalayas|The Alps cross parts of Europe.
What is a peninsula?|Land mostly surrounded by water and connected to larger land|Land completely surrounded by water|Only a mountain peak|A peninsula is connected to a larger land area.
Which sea lies south of much of Europe?|The Mediterranean Sea|Only the Arctic Ocean|The Chesapeake Bay|The Mediterranean lies between Europe, Africa, and Asia.
Which is true of Europe today?|People live in modern communities with many backgrounds|Everyone lives in a castle|No one uses modern transportation|Historic places and modern life coexist.
Which country is associated with ancient Athens?|Greece|Brazil|Canada|Athens is in Greece.
`);
topic('south-america-trip','Across South America','Geography','🦙','Follow the Andes and the Amazon.',[
 'South America includes countries such as Brazil, Peru, Chile, and Argentina.',
 'The Andes form a long mountain range along the western side. The Amazon basin includes a very large tropical rainforest.',
 'Portuguese is the main language of Brazil. Spanish and many Indigenous languages are spoken across other parts of the continent.'
],'Trace the Andes on an atlas, then locate Brazil and Peru. Learn about one Indigenous language from a reliable source.',geo,`
Which country is in South America?|Brazil|Egypt|Japan|Brazil is a country in South America.
Which mountain range runs along western South America?|The Andes|The Alps|The Blue Ridge|The Andes extend along the continent’s western side.
The Amazon basin is known for what?|A large tropical rainforest|Only polar ice|Only dry bare rock|Much of the Amazon basin contains tropical rainforest.
What is Brazil’s main language?|Portuguese|Only English|Only Japanese|Portuguese is the official and main language of Brazil.
Which of these countries is on South America’s western side?|Peru|Germany|India|Peru lies on South America’s western side.
Which long narrow country lies along the continent’s west coast?|Chile|Mongolia|Nepal|Chile lies between the Andes and the Pacific coast.
Which languages also belong in a picture of South America?|Many Indigenous languages|No languages except one|Only Latin from ancient Rome|Indigenous languages remain important across South America.
Which ocean lies west of South America?|Pacific Ocean|Only the Arctic Ocean|The Chesapeake Bay|The Pacific Ocean borders the west coast.
`);
topic('oceania-trip','Australia & Pacific islands','Geography','🐨','Explore a continent and a wider region.',[
 'Australia is both a country and, in our seven-continent model, a continent. Oceania is a wider region including many Pacific islands.',
 'New Zealand is a country in the southwestern Pacific. Pacific communities have many different languages and histories.',
 'Aboriginal and Torres Strait Islander peoples have longstanding ties to Australia. Māori are Indigenous to New Zealand.'
],'Find Australia, New Zealand, and Fiji on an atlas. Notice how a region can include many islands and countries.',['https://www.nationalgeographic.org/national-geographic-map-policy'],`
In our seven-continent model, Australia is what?|A continent and a country|A city in Virginia|Only a river|Australia names both the country and a continent in this model.
What is Oceania?|A wider region including Australia and many Pacific islands|One single town|A synonym for Europe|Oceania includes many island communities and countries.
Where is New Zealand?|The southwestern Pacific|Northern Africa|The center of Europe|New Zealand is in the southwestern Pacific.
Which ocean is central to Oceania?|Pacific Ocean|Only the Arctic Ocean|Only the Atlantic Ocean|The region includes many islands across the Pacific.
Which peoples have longstanding ties to Australia?|Aboriginal and Torres Strait Islander peoples|Only people arriving yesterday|Only ancient Romans|These peoples have diverse and longstanding cultures in Australia.
Māori are Indigenous to which country?|New Zealand|Egypt|Italy|Māori are Indigenous to Aotearoa New Zealand.
Which country is in the Pacific island region?|Fiji|Austria|Switzerland|Fiji is a Pacific island country.
Which statement is accurate?|Pacific island cultures are varied|All Pacific island people speak one language|Every island has the same history|The region has many distinct communities and histories.
`);
topic('china-bronze','Shang & Zhou clues','History','🏺','Read objects from very early China.',[
 'The Shang and Zhou were dynasties of ancient China, long before the Qin and Han. A dynasty is a series of rulers from a family.',
 'Shang oracle-bone inscriptions preserve early Chinese writing. Bronze vessels provide clues about skill, ceremonies, and social life.',
 'The Zhou followed the Shang. Objects and inscriptions are evidence, while interpretations can change as researchers learn more.'
],'Draw an imaginary museum label for an ordinary object from your home. What could it tell a future historian?',['https://afe.easia.columbia.edu/special/china_4000bce_bronze.htm'],`
Which came earlier: Shang or Han?|Shang|Han|They are names for the same dynasty|The Shang was much earlier than the Han.
What can Shang oracle bones preserve?|Early Chinese writing|Modern printed newspapers|Digital photographs|Inscriptions on oracle bones preserve early Chinese writing.
Which material was used for important ancient vessels?|Bronze|Modern plastic only|Cardboard only|Skilled craftspeople cast bronze vessels.
Which dynasty followed the Shang?|Zhou|Qing|Ming|The Zhou followed the Shang.
What is a dynasty?|A series of rulers from a family|A kind of cloud|A modern computer|Dynasty names organize parts of political history.
What is an inscription?|Writing carved or marked on a surface|An empty room|A type of rainfall|Inscriptions can preserve words on objects.
How should researchers use an ancient object?|Study it carefully with other evidence|Guess its use from color alone|Assume one object explains every person|Objects are interpreted alongside other evidence.
Can new evidence change a historical explanation?|Yes|No, evidence never matters|Only a coin toss can change history|Researchers revise interpretations as evidence improves.
`);
topic('china-yuan','Yuan journeys','History','🧭','Explore exchange during the Yuan dynasty.',[
 'The Yuan dynasty ruled China from 1271 to 1368. Its rulers came from the Mongol imperial family.',
 'Travel, trade, and artistic exchange linked distant places. Blue-and-white porcelain developed and flourished through such connections.',
 'Trade involves many workers and communities. An object may reveal connected histories across regions.'
],'Trace an imaginary trade route on a map. List the people who might help a fragile bowl travel safely.',['https://www.metmuseum.org/essays/yuan-dynasty-1271-1368'],`
The Yuan rulers came from which imperial background?|Mongol|Ancient Roman only|Modern American|The Yuan rulers belonged to the Mongol imperial family.
Which dates belong to the Yuan dynasty?|1271–1368|1900–2000|3000–2900 BCE|The Yuan dynasty is dated 1271–1368.
Which dynasty followed the Yuan?|Ming|Shang|Zhou|The Ming followed the Yuan in 1368.
What can trade carry besides goods?|Ideas and artistic influences|Only empty boxes|Nothing beyond the goods|Travel and trade can connect people and ideas.
What is porcelain?|A fine ceramic material|A kind of map|A metal coin|Porcelain is a ceramic material often used for vessels.
Which colors are central to blue-and-white porcelain?|Blue decoration on white ceramic|Only red and green|Only black and orange|Blue-and-white porcelain combines blue designs with a white ceramic body.
Who helped trade happen?|Craftspeople, carriers, merchants, and many others|Only one ruler|No ordinary workers|Trade relied on many kinds of work.
Why compare objects from different places?|To look for connections and differences|To claim all cultures are identical|To avoid looking at evidence|Comparisons can reveal exchange while respecting differences.
`);
topic('china-qing','Qing art detectives','History','🖌️','Look at China’s last imperial dynasty.',[
 'The Qing was China’s last imperial dynasty. Manchu rulers led a large empire from the seventeenth century into the early twentieth.',
 'Artists painted landscapes, plants, and other subjects. Some followed older traditions while others explored new ways of painting.',
 'Paintings are evidence of an artist’s choices. They are not exact photographs of everyone’s life.'
],'Draw the same tree in two different styles. Discuss how an artist chooses what to include.',['https://www.metmuseum.org/essays/the-qing-dynasty-1644-1911-painting'],`
Which was China’s last imperial dynasty?|Qing|Shang|Qin|The Qing was the last imperial dynasty.
The Qing rulers were associated with which people?|Manchu|Ancient Romans|Vikings only|The ruling family was Manchu.
Which dynasty came earlier: Ming or Qing?|Ming|Qing|They are exactly the same|The Ming preceded the Qing.
Which subject appeared in Chinese landscape painting?|Mountains and rivers|Only modern cars|Only empty white circles|Landscape painters often represented mountains, rivers, and trees.
Can two artists paint the same place differently?|Yes, they make different choices|No, all paintings are identical|Only cameras can make pictures|Artists select styles, details, and viewpoints.
Should one painting be treated as a photograph of everyone’s life?|No|Yes, always|Only if its frame is gold|A painting represents particular choices and contexts.
What does imperial mean here?|Connected with an emperor or empire|Connected only with insects|A type of arithmetic|Imperial describes an emperor or empire.
Which helps us interpret a painting?|Who made it, when, and for whom|Only its frame’s price|Ignoring its context|Context helps us understand an artwork.
`);
topic('greece-rome','Greek & Roman builders','History','🏛️','Compare columns, arches, roads, and waterworks.',[
 'Ancient Greek builders used columns in many public buildings. Greek communities included different city-states rather than one modern nation.',
 'Roman builders used arches, roads, and aqueducts. Aqueducts carried water, and roads connected places across the Roman world.',
 'Both societies included people with unequal rights. Surviving monuments tell only part of the story of everyday workers and families.'
],'Build a paper column and a small block arch with a grown-up. Compare how the shapes support weight.',['https://www.metmuseum.org/essays/architecture-in-ancient-greece','https://www.metmuseum.org/-/media/files/learn/for-educators/publications-for-educators/roman.pdf'],`
What is a column in a building?|An upright support|A kind of rain|An ocean current|Columns support parts of a building.
What shape is an arch?|A curved structure over an opening|Only a flat line|Only a loose pile of leaves|Arches can carry loads across an opening.
What did an aqueduct carry?|Water|Only letters|Only sand for painting|Aqueducts carried water to communities.
Why were roads important to the Roman world?|They connected places and supported travel|They stopped all movement|They were only drawings|Roads helped move people, messages, and goods.
Which city is associated with ancient Greece?|Athens|Richmond|Tokyo|Athens was an important Greek city-state.
Were ancient Greek city-states all one modern nation?|No|Yes, exactly like a modern country|They were all one building|City-states were separate communities with their own governments.
Did everyone have equal rights in these ancient societies?|No|Yes, everyone always did|Rights never existed anywhere|Rights varied greatly, and many people were excluded.
What can monuments leave out?|The lives of many ordinary workers and families|Every stone used|The fact that buildings had supports|A monument gives only part of a society’s history.
`);
topic('american-inventors','American invention workshop','History','💡','Meet experiments, teamwork, and useful changes.',[
 'The Wright brothers worked on controlled powered flight and flew their Flyer in North Carolina in 1903.',
 'Thomas Edison and his teams helped develop practical electric lighting systems and sound recording. Inventions often build on earlier work.',
 'An invention is tested and improved. Many people, including those rarely named in a short account, contribute to change.'
],'Choose a daily problem and sketch a helpful invention. Explain how you would test it and improve a first model.',['https://siarchives.si.edu/history/featured-topics/stories/wright-brothers-pioneers-aviation','https://invention.si.edu/invention-stories/thomas-edisons-inventive-life'],`
What did the Wright brothers work on?|Controlled powered flight|Only deep-sea diving|Only pottery|The Wright brothers developed and tested flying machines.
Where did their 1903 Flyer flights take place?|North Carolina|The Moon|Ancient Rome|The 1903 flights took place near Kitty Hawk, North Carolina.
Which year is associated with the Wright Flyer?|1903|1203|2003 only|The Wright Flyer flew in 1903.
Which is associated with Edison’s work and teams?|Practical electric lighting systems|The first sunrise|The invention of all fire|Edison and his teams worked on electric lighting systems and many other devices.
What could a phonograph do?|Record and play sound|Grow leaves|Measure a continent’s width|A phonograph records and plays back sound.
How do inventions often develop?|Through earlier ideas, testing, and teamwork|From no previous knowledge and no work|Only by guessing once|Inventions commonly build on work by many people.
Your first model does not work. What is a useful next step?|Study the result and improve the design|Hide all the results|Claim it worked without checking|A failed test can provide information for improvement.
What should a fair invention story remember?|Many contributors may be left out of a short account|Only one person can ever contribute|Ordinary workers never help|A named inventor may work within a much larger network of contributors.
`);
fs.writeFileSync(new URL('../content/additions.json',import.meta.url),JSON.stringify(topics,null,2)+'\n');
console.log(`${topics.length} additional topics; ${topics.reduce((n,t)=>n+t.questions.length,0)} questions`);
