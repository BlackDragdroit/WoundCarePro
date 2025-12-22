export const formatDate = (dateOrTimestamp) => {
  if (!dateOrTimestamp) return '';
  
  // Handle Firestore Timestamp
  if (dateOrTimestamp.toDate && typeof dateOrTimestamp.toDate === 'function') {
    return dateOrTimestamp.toDate().toLocaleDateString('de-DE');
  }
  
  // Handle Date object or ISO string
  const date = new Date(dateOrTimestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('de-DE');
  }
  
  return '';
};

export const formatDateTime = (dateOrTimestamp) => {
  if (!dateOrTimestamp) return '';
  
  let date;
  if (dateOrTimestamp.toDate && typeof dateOrTimestamp.toDate === 'function') {
    date = dateOrTimestamp.toDate();
  } else {
    date = new Date(dateOrTimestamp);
  }

  if (isNaN(date.getTime())) return '';

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
