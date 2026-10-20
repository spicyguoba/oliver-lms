// Original short learning cues. Dates, identities and image rights are checked by
// scripts/build-people.mjs against the linked encyclopedia / Wikidata records.
// Titles use English Wikipedia article names to avoid ambiguous name searches.
export const PEOPLE_GROUPS = [
  {
    id: "science",
    name: "Science discoverers",
    icon: "🔬",
    rows: `
Albert Einstein|Developed relativity, connecting space, time and gravity.
Marie Curie|Studied radioactivity and helped discover polonium and radium.
Isaac Newton|Explained laws of motion and universal gravitation.
Galileo Galilei|Used telescopes to study the sky and Jupiter's moons.
Nicolaus Copernicus|Proposed a model with Earth moving around the Sun.
Johannes Kepler|Described planets moving in elliptical orbits.
Michael Faraday|Discovered important connections between electricity and magnetism.
James Clerk Maxwell|Showed that light is an electromagnetic wave.
Niels Bohr|Developed an influential model of the atom.
Ernest Rutherford|Helped reveal the small, dense nucleus of the atom.
Max Planck|Introduced energy quanta, helping start quantum physics.
Werner Heisenberg|Developed the uncertainty principle in quantum physics.
Erwin Schrödinger|Created a wave equation used in quantum physics.
Paul Dirac|Helped connect quantum physics with special relativity.
Richard Feynman|Developed ways to understand how light and matter interact.
Lise Meitner|Helped explain nuclear fission, the splitting of atomic nuclei.
Chien-Shiung Wu|Led an experiment that challenged a rule called parity.
Satyendra Nath Bose|Studied how certain tiny particles behave together.
Abdus Salam|Helped unite the electromagnetic and weak nuclear forces.
C. V. Raman|Discovered how light changes when it scatters in materials.
Subrahmanyan Chandrasekhar|Explained a mass limit for white dwarf stars.
Stephen Hawking|Studied black holes and predicted that they emit radiation.
Vera Rubin|Found galaxy-rotation evidence supporting dark matter.
Edwin Hubble|Showed that galaxies beyond the Milky Way exist.
Henrietta Swan Leavitt|Found a star-brightness pattern used to measure cosmic distances.
Cecilia Payne-Gaposchkin|Showed that stars are made mainly of hydrogen and helium.
Annie Jump Cannon|Organized stars into groups using their spectra.
Jocelyn Bell Burnell|Discovered the first radio pulsars as a research student.
Caroline Herschel|Discovered comets and helped map the night sky.
William Herschel|Discovered the planet Uranus.
Maria Mitchell|Discovered a comet and became an astronomy educator.
Tycho Brahe|Made precise observations of stars and planets before telescopes.
Antoine Lavoisier|Helped explain combustion and the role of oxygen.
Dmitri Mendeleev|Organized a periodic table and predicted missing elements.
John Dalton|Developed an early modern atomic theory.
Robert Boyle|Studied the relationship between gas pressure and volume.
Joseph Priestley|Investigated gases, including oxygen.
Henry Cavendish|Measured Earth's density with a careful laboratory experiment.
Humphry Davy|Used electricity to isolate several chemical elements.
Dorothy Hodgkin|Used X-rays to reveal structures of important molecules.
Linus Pauling|Explained chemical bonding and studied molecular structures.
Irène Joliot-Curie|Helped discover artificial radioactivity.
Ahmed Zewail|Used extremely short laser pulses to study chemical reactions.
Tu Youyou|Helped develop artemisinin, a medicine against malaria.
Ada Yonath|Studied the structure of ribosomes, the cell's protein makers.
Charles Darwin|Explained how natural selection helps species change over generations.
Alfred Russel Wallace|Independently developed the idea of evolution by natural selection.
Gregor Mendel|Used pea plants to discover patterns of inheritance.
Rosalind Franklin|Made X-ray studies that helped reveal DNA's structure.
Francis Crick|Helped develop the double-helix model of DNA.
James Watson|Helped develop the double-helix model of DNA.
Barbara McClintock|Discovered that some genes can move within chromosomes.
Louis Pasteur|Studied microbes and developed pasteurization and vaccines.
Robert Koch|Identified microbes that cause important diseases.
Alexander Fleming|Discovered the antibacterial effects of penicillin mold.
Joseph Lister|Promoted antiseptic methods to reduce infections during surgery.
Edward Jenner|Developed an early vaccine against smallpox.
Jonas Salk|Led development of an injected polio vaccine.
Albert Sabin|Developed an oral polio vaccine.
Florence Nightingale|Improved nursing and used statistics to support better care.
Elizabeth Blackwell|Became the first woman to earn a U.S. medical degree.
Mary Anning|Found important fossils of ancient marine reptiles.
Jane Goodall|Studied wild chimpanzees and their use of tools.
Dian Fossey|Studied mountain gorillas and worked for their protection.
Rachel Carson|Explained how pesticides can harm wildlife and ecosystems.
Wangari Maathai|Founded the Green Belt Movement to plant trees and support communities.
Sylvia Earle|Explored the ocean and advocated for marine protection.
E. O. Wilson|Studied ants, biodiversity and the protection of living things.
Carl Linnaeus|Developed a system for naming and classifying living things.
Alexander von Humboldt|Studied links among climate, geography and living things.
Alfred Wegener|Proposed that continents had moved across Earth's surface.
Inge Lehmann|Used earthquake waves to discover Earth's solid inner core.
Marie Tharp|Mapped the seafloor and helped reveal the Mid-Atlantic Ridge.
James Hutton|Explained how slow geological processes shape Earth over long times.
Charles Lyell|Showed how present-day geological processes help explain Earth's past.
Svante Arrhenius|Calculated how carbon dioxide could affect Earth's temperature.
Eunice Newton Foote|Experimented with gases and showed carbon dioxide traps heat.
John Tyndall|Studied how gases absorb heat radiation.
George Washington Carver|Researched crops and encouraged farmers to improve soil.
Percy Lavon Julian|Developed ways to make useful medicines from plant materials.
Charles R. Drew|Improved methods for storing blood plasma for transfusions.
Patricia Bath|Developed a laser device used in cataract treatment.
Katalin Karikó|Helped develop modified messenger RNA for medical use.
Jennifer Doudna|Helped develop CRISPR-Cas9 as a gene-editing tool.
Emmanuelle Charpentier|Helped develop CRISPR-Cas9 as a gene-editing tool.
Frances Arnold|Developed directed evolution to create useful enzymes.
Rita Levi-Montalcini|Helped discover nerve growth factor.
Santiago Ramón y Cajal|Studied nerve cells and the structure of the nervous system.
Camillo Golgi|Developed a staining method for studying nerve tissue.
Severo Ochoa|Studied how cells make RNA.
`,
  },
  {
    id: "math",
    name: "Math & computer minds",
    icon: "💻",
    rows: `
Euclid|Organized geometry in a work called the Elements.
Archimedes|Studied geometry, levers and why objects float.
Pythagoras|Is associated with a famous rule about right triangles.
Hypatia|Taught mathematics and philosophy in ancient Alexandria.
Al-Khwarizmi|Wrote influential works on algebra and calculation.
Omar Khayyam|Studied cubic equations and helped improve a calendar.
Fibonacci|Introduced many European readers to Hindu-Arabic numerals.
René Descartes|Linked algebra and geometry using coordinates.
Pierre de Fermat|Made influential discoveries in number theory.
Blaise Pascal|Studied probability and designed a mechanical calculator.
Gottfried Wilhelm Leibniz|Independently developed calculus and worked on binary numbers.
Leonhard Euler|Made discoveries across mathematics and introduced useful notation.
Carl Friedrich Gauss|Made major contributions to number theory and measurement.
Sophie Germain|Studied number theory and how elastic surfaces vibrate.
Ada Lovelace|Wrote a published algorithm for Babbage's proposed computing machine.
Charles Babbage|Designed the Analytical Engine, a programmable mechanical computer.
George Boole|Developed a form of logic important to digital computers.
Bernhard Riemann|Developed new ideas about geometry and curved spaces.
Georg Cantor|Created set theory and studied different sizes of infinity.
Sofia Kovalevskaya|Made important contributions to differential equations and mechanics.
Henri Poincaré|Helped develop topology and the study of dynamical systems.
David Hilbert|Proposed famous problems that guided mathematical research.
Emmy Noether|Connected symmetries in physics with conservation laws.
Srinivasa Ramanujan|Discovered remarkable formulas and patterns in numbers.
G. H. Hardy|Studied number theory and collaborated with Ramanujan.
Alan Turing|Developed ideas about computation and helped wartime codebreaking.
Alonzo Church|Developed lambda calculus, an important model of computation.
Kurt Gödel|Showed limits to what some mathematical systems can prove.
John von Neumann|Contributed to computing, game theory and mathematics.
Claude Shannon|Founded information theory, the mathematics of communication.
Grace Hopper|Helped develop early compilers and promoted readable programming languages.
Katherine Johnson|Calculated flight paths for U.S. space missions.
Dorothy Vaughan|Led computing staff at NACA and learned computer programming.
Mary Jackson (engineer)|Became NASA's first Black woman engineer.
Annie Easley|Worked on computing for energy research and rocket technology.
Margaret Hamilton (software engineer)|Led software work for the Apollo guidance computer.
Jean Bartik|Helped program ENIAC, an early electronic computer.
Betty Holberton|Helped program ENIAC and develop computer software.
Frances E. Allen|Improved techniques that help compilers optimize computer programs.
Barbara Liskov|Developed influential ideas about programming languages and data abstraction.
Radia Perlman|Designed the spanning-tree protocol used in computer networks.
Tim Berners-Lee|Invented the World Wide Web.
Vint Cerf|Helped design TCP/IP, key communication rules of the Internet.
Bob Kahn|Helped design TCP/IP, key communication rules of the Internet.
Donald Knuth|Studied algorithms and created the TeX typesetting system.
Edsger W. Dijkstra|Developed important algorithms and ideas about reliable programs.
Dennis Ritchie|Created the C programming language and helped develop Unix.
Ken Thompson|Helped create the Unix operating system.
Linus Torvalds|Created the Linux operating-system kernel.
Guido van Rossum|Created the Python programming language.
James Gosling|Led the creation of the Java programming language.
Hedy Lamarr|Co-invented a frequency-hopping communication design.
Maryam Mirzakhani|Studied the geometry of curved surfaces.
Terence Tao|Works on number theory, analysis and other areas of mathematics.
Andrew Wiles|Proved Fermat's Last Theorem.
Ingrid Daubechies|Developed wavelets used in signal and image processing.
Shakuntala Devi|Became famous for performing difficult calculations mentally.
Sun-Yung Alice Chang|Made important contributions to mathematical analysis and geometry.
Shiing-Shen Chern|Developed important ideas in differential geometry.
Hua Luogeng|Made important contributions to number theory.
`,
  },
  {
    id: "invention",
    name: "Inventors & builders",
    icon: "⚙️",
    rows: `
Johannes Gutenberg|Developed a movable-type printing system in Europe.
Bi Sheng|Developed an early movable-type printing method in China.
Cai Lun|Is traditionally credited with improving papermaking in ancient China.
Zhang Heng|Designed an early device for detecting distant earthquakes.
Shen Kuo|Wrote about science, technology and the magnetic compass.
Su Song|Designed an elaborate astronomical clock tower.
Ismail al-Jazari|Designed mechanical devices including clocks and water-raising machines.
James Watt|Improved steam engines, helping power the Industrial Revolution.
Thomas Newcomen|Developed a practical early steam engine for pumping water.
George Stephenson|Helped develop steam locomotives and early railways.
Isambard Kingdom Brunel|Designed bridges, railways and steamships.
Nikola Tesla|Developed alternating-current motors and electrical systems.
Thomas Edison|Developed practical electric-light systems and sound-recording technology.
Alexander Graham Bell|Developed an early practical telephone.
Antonio Meucci|Worked on early devices for transmitting speech electrically.
Guglielmo Marconi|Developed long-distance radio communication.
Samuel Morse|Helped develop the electric telegraph and Morse code.
Alfred Vail|Helped develop early telegraph equipment and Morse code.
Louis Braille|Created a raised-dot reading and writing system.
Josephine Cochrane|Developed a practical mechanical dishwasher.
Mary Anderson (inventor)|Patented an early windshield-wiper design.
Garrett Morgan|Developed safety devices and an improved traffic-signal design.
Lewis Howard Latimer|Improved the manufacture of carbon filaments for electric lights.
Granville Woods|Developed inventions for railway communication and electrical systems.
Elijah McCoy|Invented devices that automatically lubricated machinery.
Jan Matzeliger|Invented a machine that helped attach shoe uppers to soles.
Madam C. J. Walker|Built a hair-care business and supported education and community causes.
Sarah E. Goode|Patented a folding cabinet bed.
Stephanie Kwolek|Invented Kevlar, a strong material used in protective equipment.
Mary Beatrice Davidson Kenner|Developed practical inventions including an adjustable sanitary belt.
Ruth Wakefield|Created the chocolate-chip cookie recipe made famous at the Toll House.
László Bíró|Developed a successful ballpoint pen.
Chester Carlson|Invented xerography, the dry-copying process used in photocopiers.
Douglas Engelbart|Helped develop the computer mouse and interactive computing tools.
Ralph H. Baer|Led development of an early home video-game console.
Joy Mangano|Invented household products including the Miracle Mop.
Lonnie Johnson (inventor)|Invented the Super Soaker water toy and worked as an engineer.
Marion Donovan|Developed a waterproof diaper cover.
Margaret E. Knight|Invented a machine for making flat-bottomed paper bags.
George de Mestral|Invented hook-and-loop fasteners after studying burrs.
Eli Whitney|Invented a cotton gin that changed cotton processing in the United States.
Cyrus McCormick|Developed and marketed a mechanical reaper for harvesting grain.
John Deere (inventor)|Developed a steel plow suited to tough prairie soil.
Henry Ford|Expanded the use of moving assembly lines in car manufacturing.
Karl Benz|Built an early practical gasoline-powered automobile.
Bertha Benz|Made a pioneering long-distance automobile journey.
Gottlieb Daimler|Developed high-speed internal-combustion engines and motor vehicles.
Rudolf Diesel|Invented the compression-ignition engine called the diesel engine.
Elisha Otis|Developed a safety brake that made elevators safer.
Fazlur Rahman Khan|Developed structural systems used in very tall buildings.
`,
  },
  {
    id: "leaders",
    name: "Leaders & changemakers",
    icon: "🕊️",
    rows: `
George Washington|Served as the first president of the United States.
John Adams|Served as the second U.S. president and supported independence.
Thomas Jefferson|Was a principal writer of the Declaration of Independence.
James Madison|Helped shape the U.S. Constitution and Bill of Rights.
James Monroe|Served as the fifth president of the United States.
John Quincy Adams|Served as U.S. president and later opposed slavery in Congress.
Abraham Lincoln|Led the United States during the Civil War and opposed slavery's expansion.
Ulysses S. Grant|Led Union armies and later served as U.S. president.
Theodore Roosevelt|Promoted conservation and helped expand protected public lands.
Woodrow Wilson|Supported the creation of the League of Nations.
Franklin D. Roosevelt|Led the United States during the Great Depression and much of World War II.
Harry S. Truman|Served as U.S. president after Franklin Roosevelt.
Dwight D. Eisenhower|Led Allied forces in Europe and later served as U.S. president.
John F. Kennedy|Set a national goal of landing people on the Moon.
Lyndon B. Johnson|Signed the Civil Rights Act of 1964 into law.
Jimmy Carter|Helped negotiate the Camp David Accords and worked on humanitarian causes.
Ronald Reagan|Served as the 40th president of the United States.
George H. W. Bush|Served as the 41st president of the United States.
Bill Clinton|Served as the 42nd president of the United States.
Barack Obama|Became the first Black president of the United States.
Benjamin Franklin|Worked on science, printing and the founding of the United States.
Alexander Hamilton|Helped design the early U.S. financial system.
John Jay|Served as the first chief justice of the United States.
Thurgood Marshall|Became the first Black justice of the U.S. Supreme Court.
Sandra Day O'Connor|Became the first woman justice of the U.S. Supreme Court.
Ruth Bader Ginsburg|Worked for equal rights and served on the U.S. Supreme Court.
Sonia Sotomayor|Became the first Latina justice of the U.S. Supreme Court.
Eleanor Roosevelt|Helped lead work on the Universal Declaration of Human Rights.
Harriet Tubman|Helped enslaved people escape through the Underground Railroad.
Frederick Douglass|Spoke and wrote powerfully against slavery.
Sojourner Truth|Worked for the abolition of slavery and women's rights.
Rosa Parks|Challenged racial segregation by refusing to give up a bus seat.
Martin Luther King Jr.|Led nonviolent campaigns for civil rights in the United States.
John Lewis|Worked for voting rights and served in the U.S. Congress.
Bayard Rustin|Helped organize the 1963 March on Washington.
Fannie Lou Hamer|Organized for voting rights in Mississippi.
Ruby Bridges|Helped desegregate an elementary school as a six-year-old child.
Claudette Colvin|Challenged bus segregation before the Montgomery bus boycott.
Ida B. Wells|Investigated racial violence and campaigned for civil rights.
W. E. B. Du Bois|Studied society and helped found the NAACP.
Booker T. Washington|Led Tuskegee Institute and promoted education.
Mary McLeod Bethune|Founded a school and worked for education and civil rights.
Susan B. Anthony|Campaigned for women's right to vote.
Elizabeth Cady Stanton|Helped organize the Seneca Falls women's-rights convention.
Lucretia Mott|Worked against slavery and for women's rights.
Alice Paul|Helped campaign for the U.S. constitutional amendment on women's voting rights.
Emmeline Pankhurst|Led a movement for women's voting rights in Britain.
Millicent Fawcett|Campaigned peacefully for women's voting rights in Britain.
Nelson Mandela|Fought apartheid and became South Africa's first Black president.
Desmond Tutu|Worked against apartheid and supported reconciliation in South Africa.
Mahatma Gandhi|Led nonviolent campaigns for India's independence.
Jawaharlal Nehru|Served as independent India's first prime minister.
B. R. Ambedkar|Helped draft India's Constitution and challenged caste discrimination.
Sarojini Naidu|Worked for India's independence and women's rights.
Indira Gandhi|Became India's first woman prime minister.
Sirimavo Bandaranaike|Became the world's first woman prime minister.
Benazir Bhutto|Became Pakistan's first woman prime minister.
Golda Meir|Served as Israel's first woman prime minister.
Margaret Thatcher|Became the United Kingdom's first woman prime minister.
Angela Merkel|Became Germany's first woman chancellor.
Jacinda Ardern|Served as prime minister of New Zealand.
Gro Harlem Brundtland|Led work on sustainable development and served as Norway's prime minister.
Winston Churchill|Led Britain as prime minister during much of World War II.
Charles de Gaulle|Led Free France and later served as French president.
Konrad Adenauer|Served as West Germany's first chancellor.
Willy Brandt|Worked to improve relations between East and West in Europe.
Mikhail Gorbachev|Introduced major reforms in the Soviet Union.
Václav Havel|Wrote plays and helped lead Czechoslovakia's transition to democracy.
Lech Wałęsa|Helped lead Poland's Solidarity movement.
Kofi Annan|Served as secretary-general of the United Nations.
Dag Hammarskjöld|Worked for international diplomacy as a United Nations secretary-general.
Sun Yat-sen|Helped lead the movement that ended China's imperial system.
Emperor Taizong of Tang|Ruled during an influential period of China's Tang dynasty.
Wu Zetian|Ruled China as emperor during the Zhou interlude of the Tang era.
Emperor Wen of Sui|Founded China's Sui dynasty and helped reunify China.
Akbar|Expanded the Mughal Empire and encouraged religious discussion.
Ashoka|Ruled the Maurya Empire and promoted Buddhist teachings.
Mansa Musa|Ruled Mali and supported learning and building in Timbuktu.
Hatshepsut|Ruled ancient Egypt and supported major building projects.
Cleopatra|Ruled Egypt during the final years of the Ptolemaic kingdom.
`,
  },
  {
    id: "thinkers",
    name: "Thinkers & teachers",
    icon: "💭",
    rows: `
Socrates|Used questions and discussion to examine ideas about life.
Plato|Wrote philosophical dialogues and founded the Academy in Athens.
Aristotle|Studied logic, living things, ethics and many other subjects.
Confucius|Taught about learning, good conduct and caring relationships.
Laozi|Is traditionally associated with the Tao Te Ching and Daoist thought.
Mencius|Developed Confucian ideas about human nature and good government.
Zhuang Zhou|Explored Daoist ideas through imaginative stories and conversations.
Xunzi (philosopher)|Wrote about education, conduct and the importance of deliberate learning.
Mozi|Argued for impartial care and criticized wasteful warfare.
Sun Tzu|Is traditionally associated with the strategy book The Art of War.
Zhu Xi|Developed an influential interpretation of Confucian learning.
Wang Yangming|Taught about the connection between knowing and acting.
Gautama Buddha|Taught a path aimed at understanding suffering and developing wisdom.
Mahavira|Taught nonviolence and became an important teacher in Jainism.
Nagarjuna|Developed influential Buddhist philosophical arguments.
Adi Shankara|Developed an influential interpretation of Advaita Vedanta.
Avicenna|Wrote influential works about medicine and philosophy.
Averroes|Wrote commentaries on Aristotle and studied philosophy and medicine.
Al-Farabi|Wrote about logic, politics, philosophy and music.
Ibn Khaldun|Studied how societies, economies and governments change.
Maimonides|Wrote influential works on philosophy, medicine and Jewish law.
Augustine of Hippo|Wrote influential works on philosophy and Christian thought.
Thomas Aquinas|Connected Aristotelian philosophy with Christian theology.
Francis Bacon|Argued for careful observation and experiments in studying nature.
John Locke|Wrote about knowledge, rights and government by consent.
Thomas Hobbes|Wrote about social agreements and the role of government.
Baruch Spinoza|Developed philosophical ideas about nature, reason and ethics.
David Hume|Examined evidence, human understanding and how we form beliefs.
Immanuel Kant|Wrote about knowledge, moral duties and human judgment.
Jean-Jacques Rousseau|Wrote about education, society and the social contract.
Voltaire|Used writing to argue for tolerance and criticize abuses of power.
Montesquieu|Explained how separating government powers can limit abuses.
Mary Wollstonecraft|Argued that women should have equal opportunities for education.
John Stuart Mill|Wrote about liberty, government and equal rights.
Harriet Taylor Mill|Wrote about equality and women's rights.
Simone de Beauvoir|Examined women's lives and argued against limiting gender roles.
Hannah Arendt|Studied political power, freedom and totalitarian government.
Bertrand Russell|Worked on logic and wrote about philosophy and peace.
Ludwig Wittgenstein|Examined language, meaning and philosophical problems.
Karl Popper|Argued that scientific ideas should be open to testing and criticism.
Thomas Kuhn|Studied how major changes happen in scientific thinking.
John Dewey|Promoted learning through experience and democratic education.
Maria Montessori|Developed an educational approach using hands-on, self-directed learning.
Friedrich Fröbel|Created the kindergarten idea and emphasized learning through play.
Jean Piaget|Studied how children's thinking develops.
Lev Vygotsky|Studied how social interaction supports children's learning.
Paulo Freire|Promoted education through dialogue and critical thinking.
Helen Keller|Wrote and campaigned for disability rights after learning to communicate.
Anne Sullivan|Taught Helen Keller using patient, hands-on communication methods.
Rabindranath Tagore|Wrote poetry and founded an experimental school at Santiniketan.
`,
  },
  {
    id: "writers",
    name: "Writers & storytellers",
    icon: "📚",
    rows: `
Homer|Is traditionally credited with the ancient Greek Iliad and Odyssey.
Aesop|Is associated with animal fables that teach lessons.
Sappho|Wrote lyric poetry in ancient Greece.
Virgil|Wrote the Roman epic poem the Aeneid.
Dante Alighieri|Wrote the long poem known as the Divine Comedy.
Geoffrey Chaucer|Wrote The Canterbury Tales in Middle English.
William Shakespeare|Wrote plays including Hamlet and A Midsummer Night's Dream.
Miguel de Cervantes|Wrote the novel Don Quixote.
Murasaki Shikibu|Wrote The Tale of Genji in Japan.
Sei Shōnagon|Wrote observations of court life in The Pillow Book.
Li Bai|Wrote celebrated poetry during China's Tang dynasty.
Du Fu|Wrote poetry about people's lives and the events of Tang-era China.
Wang Wei (Tang dynasty)|Wrote poems and painted during China's Tang dynasty.
Su Shi|Wrote poetry and prose and practiced calligraphy in Song-era China.
Li Qingzhao|Wrote influential lyric poetry during China's Song dynasty.
Cao Xueqin|Wrote much of the novel Dream of the Red Chamber.
Wu Cheng'en|Is traditionally credited with the novel Journey to the West.
Luo Guanzhong|Is traditionally credited with Romance of the Three Kingdoms.
Lu Xun|Wrote influential modern Chinese stories and essays.
Lao She|Wrote Chinese novels and plays including Rickshaw Boy.
Jane Austen|Wrote novels including Pride and Prejudice.
Mary Shelley|Wrote the novel Frankenstein.
Charles Dickens|Wrote novels including Oliver Twist and A Christmas Carol.
Charlotte Brontë|Wrote the novel Jane Eyre.
Emily Brontë|Wrote the novel Wuthering Heights.
George Eliot|Wrote novels including Middlemarch.
Leo Tolstoy|Wrote novels including War and Peace.
Fyodor Dostoevsky|Wrote novels exploring difficult moral questions.
Victor Hugo|Wrote Les Misérables and The Hunchback of Notre-Dame.
Alexandre Dumas|Wrote adventure stories including The Three Musketeers.
Jules Verne|Wrote imaginative adventures involving travel and science.
H. G. Wells|Wrote science-fiction stories including The Time Machine.
Arthur Conan Doyle|Created the fictional detective Sherlock Holmes.
Agatha Christie|Wrote mystery stories featuring clever detectives.
Mark Twain|Wrote stories including The Adventures of Tom Sawyer.
Louisa May Alcott|Wrote Little Women.
Emily Dickinson|Wrote distinctive short poems about life and nature.
Walt Whitman|Wrote the poetry collection Leaves of Grass.
Langston Hughes|Wrote poems and stories during the Harlem Renaissance.
Maya Angelou|Wrote poetry and memoirs and worked for civil rights.
Toni Morrison|Wrote novels about Black lives and American history.
Zora Neale Hurston|Collected folklore and wrote Their Eyes Were Watching God.
Chinua Achebe|Wrote Things Fall Apart about life and change in Nigeria.
Wole Soyinka|Wrote plays, poetry and essays and won the Nobel literature prize.
Naguib Mahfouz|Wrote novels about life in Egypt, including the Cairo Trilogy.
Gabriel García Márquez|Wrote stories using magical realism, including One Hundred Years of Solitude.
Pablo Neruda|Wrote poetry about love, nature and public life.
Gabriela Mistral|Wrote poetry and worked as an educator.
Hans Christian Andersen|Wrote fairy tales including The Ugly Duckling.
Jacob Grimm|Collected and published folk tales with his brother Wilhelm.
Wilhelm Grimm|Collected and published folk tales with his brother Jacob.
Beatrix Potter|Wrote and illustrated stories about Peter Rabbit and other animals.
A. A. Milne|Created stories about Winnie-the-Pooh and his friends.
E. B. White|Wrote Charlotte's Web and Stuart Little.
Beverly Cleary|Created children's stories about Ramona Quimby and other characters.
Astrid Lindgren|Created Pippi Longstocking and other children's stories.
Tove Jansson|Created the Moomin characters and their stories.
Maurice Sendak|Wrote and illustrated Where the Wild Things Are.
Eric Carle|Created illustrated books including The Very Hungry Caterpillar.
Jacqueline Woodson|Writes books for young readers, including Brown Girl Dreaming.
`,
  },
  {
    id: "arts",
    name: "Artists & music makers",
    icon: "🎨",
    rows: `
Leonardo da Vinci|Painted the Mona Lisa and filled notebooks with scientific and engineering ideas.
Michelangelo|Created the statue David and painted the Sistine Chapel ceiling.
Raphael|Painted works including The School of Athens.
Sandro Botticelli|Painted Renaissance works including Primavera.
Albrecht Dürer|Created detailed paintings, drawings and prints.
Rembrandt|Painted expressive portraits and experimented with light and shadow.
Johannes Vermeer|Painted quiet indoor scenes including Girl with a Pearl Earring.
Diego Velázquez|Painted portraits and the scene Las Meninas.
Francisco Goya|Painted and made prints commenting on society and events.
J. M. W. Turner|Painted dramatic landscapes, weather and light.
John Constable|Painted landscapes of the English countryside.
Claude Monet|Helped develop Impressionism and painted water lilies.
Pierre-Auguste Renoir|Painted people and scenes as part of the Impressionist movement.
Edgar Degas|Painted and sculpted dancers and scenes of modern life.
Berthe Morisot|Created Impressionist paintings of everyday life.
Mary Cassatt|Painted people, often mothers and children, in the Impressionist era.
Vincent van Gogh|Painted expressive works including The Starry Night.
Paul Cézanne|Explored shape and color in landscapes and still-life paintings.
Georges Seurat|Used small dots of color in a painting method called pointillism.
Henri Matisse|Used bold colors and later created paper cut-out artworks.
Pablo Picasso|Helped develop Cubism, showing subjects from different viewpoints.
Wassily Kandinsky|Helped develop abstract painting using color and shape.
Piet Mondrian|Made abstract paintings with straight lines and blocks of color.
Georgia O'Keeffe|Painted enlarged flowers and landscapes of the American Southwest.
Frida Kahlo|Painted self-portraits exploring her life and identity.
Diego Rivera|Painted large murals showing history and working people's lives.
Jacob Lawrence|Told stories of Black history through series of paintings.
Faith Ringgold|Combined painting, fabric and storytelling in story quilts.
Alma Thomas|Created colorful abstract paintings using small blocks of color.
Katsushika Hokusai|Created Japanese prints including The Great Wave off Kanagawa.
Hiroshige|Made Japanese landscape prints showing travel routes and places.
Qi Baishi|Painted lively images of animals, plants and everyday things.
Xu Beihong|Painted horses and helped develop modern Chinese art education.
Zhang Daqian|Created Chinese paintings using both traditional and experimental methods.
Gu Kaizhi|Is remembered as an important early Chinese figure painter.
Wu Daozi|Became a celebrated painter during China's Tang dynasty.
Auguste Rodin|Created expressive sculptures including The Thinker.
Barbara Hepworth|Made abstract sculptures that explore shapes and openings.
Isamu Noguchi|Designed sculptures, gardens and useful objects.
Maya Lin|Designed the Vietnam Veterans Memorial in Washington, D.C.
Johann Sebastian Bach|Composed influential Baroque music for voices and instruments.
Wolfgang Amadeus Mozart|Composed operas, symphonies and concertos.
Ludwig van Beethoven|Composed symphonies and other music, even as his hearing declined.
Franz Schubert|Composed songs and chamber music.
Frédéric Chopin|Composed expressive music especially for the piano.
Clara Schumann|Performed as a pianist and composed music.
Robert Schumann|Composed piano, vocal and orchestral music.
Fanny Mendelssohn|Composed songs, piano pieces and other music.
Felix Mendelssohn|Composed orchestral and chamber music and helped revive Bach's music.
Pyotr Ilyich Tchaikovsky|Composed ballet music including The Nutcracker and Swan Lake.
Antonín Dvořák|Composed the New World Symphony and other orchestral music.
Florence Price|Composed symphonies and became a pioneering Black American concert composer.
Scott Joplin|Composed ragtime piano music including The Entertainer.
Louis Armstrong|Helped shape jazz as a trumpet player and singer.
Duke Ellington|Composed jazz music and led an influential orchestra.
Ella Fitzgerald|Became celebrated for jazz singing and scat improvisation.
Billie Holiday|Used her distinctive voice to interpret jazz songs.
Nina Simone|Combined music with a strong voice for civil rights.
Marian Anderson|Became a celebrated singer and challenged racial barriers in music.
Leontyne Price|Became an internationally celebrated opera singer.
Yo-Yo Ma|Performs cello music and brings musicians from different cultures together.
Lang Lang|Became an internationally known concert pianist.
Ravi Shankar|Introduced many listeners around the world to sitar music.
Miriam Makeba|Shared South African music and spoke against apartheid.
Celia Cruz|Became a celebrated singer of Cuban and salsa music.
Astor Piazzolla|Developed a new style of tango music.
Leonard Bernstein|Composed music and taught audiences about orchestral music.
Aaron Copland|Composed American concert music including Appalachian Spring.
George Gershwin|Combined jazz and classical influences in works such as Rhapsody in Blue.
John Williams|Composed film music including the Star Wars themes.
`,
  },
  {
    id: "explorers",
    name: "Explorers & space pioneers",
    icon: "🚀",
    rows: `
Neil Armstrong|Became the first person to walk on the Moon.
Buzz Aldrin|Walked on the Moon during the Apollo 11 mission.
Michael Collins (astronaut)|Piloted Apollo 11's command module while his crewmates visited the Moon.
Yuri Gagarin|Became the first human to travel into space.
Valentina Tereshkova|Became the first woman to travel into space.
Sally Ride|Became the first American woman to travel into space.
Mae Jemison|Became the first Black woman to travel into space.
Guion Bluford|Became the first Black American to travel into space.
John Glenn|Became the first American to orbit Earth.
Alan Shepard|Became the first American to travel into space.
Eileen Collins|Became the first woman to command a Space Shuttle mission.
Peggy Whitson|Conducted many spacewalks and commanded the International Space Station.
Chris Hadfield|Commanded the International Space Station and shared space science with the public.
Samantha Cristoforetti|Became the first Italian woman in space.
Yang Liwei|Became China's first astronaut to travel into space.
Liu Yang (astronaut)|Became China's first woman astronaut in space.
Wang Yaping|Became the first Chinese woman to perform a spacewalk.
Kalpana Chawla|Became the first woman of Indian origin to travel into space.
Sunita Williams|Conducted spacewalks and served as a space-station commander.
Franklin Chang-Díaz|Flew on Space Shuttle missions and worked on plasma rocket research.
Roald Amundsen|Led the first expedition confirmed to reach the South Pole.
Robert Falcon Scott|Led Antarctic expeditions and reached the South Pole in 1912.
Ernest Shackleton|Led Antarctic expeditions and brought his stranded crew to safety.
Edmund Hillary|Reached Mount Everest's summit with Tenzing Norgay in 1953.
Tenzing Norgay|Reached Mount Everest's summit with Edmund Hillary in 1953.
Junko Tabei|Became the first woman to reach Mount Everest's summit.
Wanda Rutkiewicz|Became the first woman to reach the summit of K2.
Amelia Earhart|Became the first woman to fly solo across the Atlantic Ocean.
Bessie Coleman|Became the first Black woman to earn a pilot's license.
Jacqueline Cochran|Became the first woman to fly faster than the speed of sound.
Charles Lindbergh|Made the first solo nonstop airplane flight across the Atlantic Ocean.
Wiley Post|Became the first pilot to fly solo around the world.
Jacques Cousteau|Explored the oceans and helped develop modern scuba equipment.
Jacques Piccard|Descended to the Challenger Deep with Don Walsh.
Don Walsh|Descended to the Challenger Deep with Jacques Piccard.
Zheng He|Led large Ming-dynasty voyages across the Indian Ocean.
Xuanzang|Traveled from China to India and brought Buddhist texts back to China.
Ibn Battuta|Traveled widely across Africa, Asia and parts of Europe.
Ibn Jubayr|Wrote an account of journeys through the Mediterranean and Middle East.
Sacagawea|Helped the Lewis and Clark expedition as an interpreter and guide.
`,
  },
];
export const peoplePicks = PEOPLE_GROUPS.flatMap((g) =>
  g.rows
    .trim()
    .split("\n")
    .map((row) => {
      const [title, fact] = row.split("|");
      return { title, fact, group: g.id };
    }),
);
