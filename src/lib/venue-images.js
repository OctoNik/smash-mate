const venueSamples = {
  "d0bca924-745b-4174-9638-d36108bbee47": "/images/venues/bekasi.png",
  "290f71a9-1f71-4cf9-acea-eaa28f708215": "/images/venues/depok.png",
  "681e0b55-e071-4b60-a159-2d567d6c3715": "/images/venues/grogol.png",
  "30dda773-6fa3-43fe-b17c-b25921a28b78": "/images/venues/karawaci.png",
  "f0de5861-8cad-4939-92a6-d8f592aaac80": "/images/venues/senayan.png",
};

export const sampleVenueImage = (venueId) => venueSamples[venueId] ?? "/images/venues/grogol.png";
export const sampleEquipmentImage = (kind, name = "") => {
  const brand = ["yonex", "victor", "li-ning", "flypower"].find((value) => name.toLowerCase().includes(value));
  const type = kind === "racket_rental" ? "racket" : "shuttlecock";
  return `/images/equipment/${type}${brand ? `-${brand}` : ""}.png`;
};
