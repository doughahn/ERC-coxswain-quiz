$(document).on(':passagedisplay', function(answer, correctAnswer) {
    if (answer === correctAnswer) {
      return true;
    }
    return false;
  });