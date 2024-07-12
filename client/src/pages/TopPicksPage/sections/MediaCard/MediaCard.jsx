const MediaCard = ({ media, handlers }) => {
  const imageUrl = `https://image.tmdb.org/t/p/w500${media.poster_path}`; 

  return (
    <div className="media-card" {...handlers}>
      <img src={imageUrl} alt={media.title || media.name} />
      <h2>{media.title || media.name}</h2>
      <p>{media.overview}</p>
    </div>
  );
};

export default MediaCard;
