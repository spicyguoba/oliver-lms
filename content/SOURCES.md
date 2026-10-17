# Discovery content notes

## Completion and library expansion (2026-10-16)

`additions.json` adds fourteen original topics and 112 questions to the original 21/210: plant life, water cycle, matter, light/sound, Africa, Asia, Europe, South America, Australia/Pacific islands, Shang/Zhou, Yuan, Qing, Greek/Roman builders, and American inventors. `lib/math.mjs` adds sixteen procedural mathematics activities. The word library adds 320 meaning/sentence activities for 2,000 English and 1,200 Chinese entries; see [vocabulary content, licenses, and limits](VOCABULARY.md).

New educator references are included in each topic and shown in parent reports. They include USDA Forest Service seed-growing activities, USGS Water Science School, NASA shadow/reflection activities, NIH/NIDCD hearing, National Geographic continent/Asia/map-model resources, Columbia University's Asia for Educators bronze-age China, the Metropolitan Museum's Yuan/Qing/Greece/Rome resources, and Smithsonian histories of the Wright brothers and Edison's teams. Questions and lessons are original; no source images or passages are copied. Broad continent models are introduced as models, and culture lessons emphasize variation within places.

A completed card now shows its latest finished native round's score and date, including a zero score, and has a distinct green shade plus a text badge. Abandoned rounds do not count. Category counts are counts of exercise cards with at least one finished round; replaying does not add another completed card. Counts are not claims of mastery. Copied legacy-game round results are client-reported and dated only from this update; historical in-game stars/unlocks are retained without inventing past dates. Version 2 additively introduces `legacyCompletions`; it does not replace any prior records. The notes below describe the preceding discovery release.

Reviewed 2026-10-16. `discoveries.json` contains 21 original introductory activities and 210 question variants. These are family practice activities for roughly ages 6–9 with adult/read-aloud support, not a calibrated curriculum or assessment. Each round draws five questions. The six existing activities remain available.

The text, questions, and schematic world picture are original; source pages and their images are not embedded or copied. The child's interface has no outbound links. Parent learning insights include references for each topic.

## Educator references

- Space: [NASA Space Place solar system](https://spaceplace.nasa.gov/menu/sun/solar-system/) and [the Sun](https://spaceplace.nasa.gov/all-about-the-sun/en/).
- Weather: [NOAA water cycle](https://www.noaa.gov/education/resource-collections/freshwater/water-cycle).
- Living things and fossils: [NPS wildlife observation](https://www.nps.gov/subjects/watchingwildlife/index.htm) and [fossils](https://www.nps.gov/subjects/fossils/index.htm).
- World geography: [National Geographic Kids countries](https://kids.nationalgeographic.com/geography/countries/), [states](https://kids.nationalgeographic.com/geography/states), [map concepts](https://education.nationalgeographic.org/resource/map/), [NOAA oceans](https://oceanservice.noaa.gov/facts/howmanyoceans.html), and [Census United States geography](https://data.census.gov/map?mode=thematic&q=United+States).
- Virginia: [Virginia Energy geographic provinces](https://energy.virginia.gov/geology/FossilProvinces.shtml) and the National Geographic state reference above.
- Cultures: Smithsonian [Folklife Festival](https://festival.si.edu/), [Lunar New Year](https://asia.si.edu/whats-on/events/celebrations/lunar-new-year-celebration/), and [Diwali](https://asia.si.edu/whats-on/events/celebrations/diwali/).
- Prehistory: [Smithsonian human behavior evidence](https://humanorigins.si.edu/evidence/behavior) and [NPS Ice Age mammals](https://www.nps.gov/bela/learn/nature/ice-age-mammals.htm).
- Ancient communities: The Met's [cuneiform clay tablet](https://www.metmuseum.org/art/collection/search/325842) and [Ancient Egypt educator resource](https://resources.metmuseum.org/resources/metpublications/pdf/The_Art_of_Ancient_Egypt_A_Resource_for_Educators.pdf).
- Middle Ages: [The Met educator resource](https://resources.metmuseum.org/resources/metpublications/pdf/Medieval_Art_A_Resource_for_Educators.pdf).
- Chinese history: Smithsonian [dynasty overview](https://asia-archive.si.edu/learn/for-educators/teaching-china-with-the-smithsonian/explore-by-dynasty/), with individual Qin, Han, Tang, Song, and Ming pages linked in each topic's metadata.
- Native nations: [Smithsonian Native Knowledge 360° essential understandings](https://americanindian.si.edu/nk360/about/essential-understandings).
- American history: [NPS Jamestown](https://www.nps.gov/jame/index.htm), National Archives [Declaration](https://www.archives.gov/founding-docs/declaration-transcript), [Constitution](https://www.archives.gov/founding-docs/constitution), and [13th Amendment](https://www.archives.gov/milestone-documents/13th-amendment); Library of Congress [Washington, Jefferson, and Lincoln](https://www.loc.gov/classroom-materials/washington-jefferson-and-lincoln-three-great-presidents/); NPS [Underground Railroad people](https://www.nps.gov/subjects/undergroundrailroad/people.htm) and [civil rights](https://www.nps.gov/subjects/civilrights/index.htm).

## Teaching choices

- Learn-first cards are outside question timing. Listening to questions marks help, as before; listening to a lesson before starting does not label the later answer as assisted. Scores after studying are practice results, not claims of independent prior knowledge.
- The 50-state activity has five alphabetical trails of ten cards. A round tests only the selected trail. Names and capitals are a starting point, alongside the U.S., Virginia, map, and continent activities; this is not comprehensive state geography instruction.
- The world picture is schematic, with no national borders. It uses a seven-continent model and explains Australia/Oceania. Five named oceans form a connected ocean. No questions use disputed borders or changing population statistics.
- "Middle Ages" is labeled as a European period, approximately 500–1500 CE. Chinese timelines overlap it. Qin, Han, Tang, Song, and Ming are selected dynasties, not an exhaustive sequence. Prehistory ended at different times in different places. Humans and mammoths overlapped; humans did not live with non-bird dinosaurs.
- Native nations are diverse and present today. Culture is not a single trait shared by every person in a country. American history includes slavery, resistance, and unequal rights in short, non-graphic explanations. Historical leaders' contributions do not erase harm they caused.
- A picture sticker is derived from a completed round (any score), celebrates participation, and is not a mastery badge. Existing stars, questions, first answers, timestamps, story unlocks, paper quests, and legacy saves retain their formats. No stored field was repurposed and no database migration is needed.

To extend content, add a new unique topic ID, a short lesson, parent activity, sources, and at least eight unique questions. Keep existing IDs stable. Run unit, HTTP, production-build, and browser checks. Do not place private family materials here.
