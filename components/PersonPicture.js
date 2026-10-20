"use client";
import { useState } from "react";
export default function PersonPicture({ person, hideName = false }) {
  const [failed, setFailed] = useState(false);
  const image = person.image;
  return (
    <figure className="person-picture">
      {image && !failed ? (
        <img
          src={`/portraits/${person.id}`}
          width="320"
          height="360"
          alt={
            hideName
              ? "Historical person: use the picture and clue to identify them."
              : `Picture of ${person.name || person.targetName || "the person in this question"}`
          }
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="person-no-picture"
          role="img"
          aria-label="No verified picture available"
        >
          <span>🖼️</span>
          <p>Picture not available</p>
        </div>
      )}
      <figcaption>
        {image
          ? image.label
          : "Some historical people have no surviving, verified picture."}
      </figcaption>
      {image && (
        <details className="picture-credit">
          <summary>Picture credit</summary>
          <p>
            {image.author} · {image.license}
          </p>
          <a href={image.source} target="_blank" rel="noreferrer">
            Original image & credit
          </a>
          {" · "}
          <a href={image.licenseUrl} target="_blank" rel="noreferrer">
            License
          </a>
          <p>Shown at thumbnail size; no other changes.</p>
        </details>
      )}
    </figure>
  );
}
