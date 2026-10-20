// Original, self-contained club mascots. Decorative beside their written names.
export default function ChessFriend({ animal }) {
  const colors = {
    fox: ["#fff0dc", "#ed9957"],
    owl: ["#e8e4ff", "#9b8ac5"],
    badger: ["#e2f1e9", "#7c9295"],
    dragon: ["#def3e7", "#70b68a"],
    lion: ["#fff0c9", "#e6ac4c"],
  };
  const [back, fur] = colors[animal] || colors.fox;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="61" r="54" fill={back} />
      <path d="m15 34 3-5 3 5-3 5zm85 47 3-5 3 5-3 5z" fill={fur} />
      <ellipse cx="60" cy="101" rx="28" ry="5" fill="#233b3b" opacity=".08" />
      {animal === "fox" ? (
        <>
          <path
            d="M27 55 24 17 51 37M69 37 96 17 93 55"
            fill={fur}
            stroke="#a75531"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="m30 27 3 20 12-8m30 0 12 8 3-20" fill="#ffd3bb" />
          <path d="M25 53Q60 22 95 53L88 79 60 96 32 79Z" fill={fur} />
          <path
            d="M28 62Q43 57 60 80 77 57 92 62L85 81 60 95 35 81Z"
            fill="#fff9e9"
          />
        </>
      ) : animal === "owl" ? (
        <>
          <path
            d="M27 48 28 24 47 35Q60 30 73 35L92 24 93 48Q108 98 60 100 12 98 27 48"
            fill={fur}
          />
          <ellipse cx="60" cy="80" rx="24" ry="18" fill="#eee5f9" />
          <circle cx="43" cy="57" r="20" fill="#fff9e9" />
          <circle cx="77" cy="57" r="20" fill="#fff9e9" />
          <path d="m55 71 5 8 5-8" fill="#edb44f" />
          <path
            d="m46 87 4 3m8-3 4 3m8-3 4 3"
            stroke={fur}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : animal === "badger" ? (
        <>
          <circle cx="31" cy="36" r="13" fill={fur} />
          <circle cx="89" cy="36" r="13" fill={fur} />
          <circle cx="31" cy="36" r="7" fill="#e5c1b9" />
          <circle cx="89" cy="36" r="7" fill="#e5c1b9" />
          <path
            d="M24 62Q24 30 60 30T96 62Q96 96 60 99 24 96 24 62"
            fill="#fff9ee"
          />
          <path
            d="M40 35Q24 53 33 76L46 89Q39 63 54 32M80 35Q96 53 87 76L74 89Q81 63 66 32"
            fill={fur}
          />
        </>
      ) : animal === "dragon" ? (
        <>
          <path d="m28 54-9-18 24 9M92 54l9-18-24 9" fill="#5c9e76" />
          <path d="m36 35 1-18 17 13m12 0 17-13 1 18" fill="#f1cb70" />
          <path
            d="M27 54Q27 29 60 29T93 54L94 76Q92 98 60 99 28 98 26 76Z"
            fill={fur}
          />
          <path d="m52 30 8-14 8 14" fill="#8bd1a1" />
          <ellipse cx="60" cy="78" rx="28" ry="18" fill="#c4e7ae" />
          <circle cx="49" cy="75" r="2" fill="#567950" />
          <circle cx="71" cy="75" r="2" fill="#567950" />
        </>
      ) : (
        <>
          <path
            d="M30 36 39 26 51 29 60 22 70 29 82 26 90 37 101 44 97 58 103 69 94 80 92 93 77 95 68 104 56 99 43 103 33 94 20 89 23 74 16 64 23 52 21 41Z"
            fill="#ce8844"
          />
          <circle cx="33" cy="44" r="12" fill={fur} />
          <circle cx="87" cy="44" r="12" fill={fur} />
          <circle cx="33" cy="44" r="6" fill="#f3c690" />
          <circle cx="87" cy="44" r="6" fill="#f3c690" />
          <ellipse cx="60" cy="65" rx="34" ry="32" fill={fur} />
          <ellipse cx="60" cy="79" rx="21" ry="15" fill="#fff0cb" />
          <path
            d="m44 27-4-16 13 7 7-12 7 12 13-7-4 16Z"
            fill="#ffdc63"
            stroke="#bc8530"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="21" r="3" fill="#80ae99" />
        </>
      )}
      <g fill="#304442">
        <ellipse cx="43" cy="58" rx="3.4" ry="4.7" />
        <ellipse cx="77" cy="58" rx="3.4" ry="4.7" />
        {animal !== "owl" && animal !== "dragon" && (
          <path d="M54 73Q60 70 66 73L60 79Z" />
        )}
      </g>
      <g fill="white">
        <circle cx="42" cy="56" r="1.2" />
        <circle cx="76" cy="56" r="1.2" />
      </g>
      <g fill="#f3a4a0" opacity=".65">
        <ellipse cx="36" cy="69" rx="6" ry="3" />
        <ellipse cx="84" cy="69" rx="6" ry="3" />
      </g>
      <path
        d={animal === "owl" ? "M54 84Q60 89 66 84" : "M53 83Q60 89 67 83"}
        fill="none"
        stroke="#304442"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="m49 100 11-7 11 7-11 8Z" fill="#547f78" />
      <circle cx="60" cy="100" r="3" fill="#e6c77a" />
    </svg>
  );
}
