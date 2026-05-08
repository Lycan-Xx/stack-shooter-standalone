/**
 * Image loader with fallback support for Reddit's CSP restrictions
 */

// Simple colored shapes as fallback when external images fail to load
const createFallbackImage = (type) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (type === 'vampire') {
    canvas.width = 60;
    canvas.height = 60;

    // Draw vampire (red circle with fangs)
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.arc(30, 30, 25, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(22, 25, 4, 0, Math.PI * 2);
    ctx.arc(38, 25, 4, 0, Math.PI * 2);
    ctx.fill();

    // Fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(20, 35);
    ctx.lineTo(18, 42);
    ctx.lineTo(22, 38);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, 35);
    ctx.lineTo(42, 42);
    ctx.lineTo(38, 38);
    ctx.fill();
  } else if (type === 'player') {
    canvas.width = 60;
    canvas.height = 60;

    // Draw player (blue circle with arrow)
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(30, 30, 25, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(30, 20);
    ctx.lineTo(30, 40);
    ctx.fill();
  } else if (type === 'heart') {
    canvas.width = 30;
    canvas.height = 30;

    // Draw heart
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(15, 25);
    ctx.bezierCurveTo(15, 22, 12, 18, 8, 18);
    ctx.bezierCurveTo(4, 18, 2, 22, 2, 25);
    ctx.bezierCurveTo(2, 30, 8, 35, 15, 40);
    ctx.bezierCurveTo(22, 35, 28, 30, 28, 25);
    ctx.bezierCurveTo(28, 22, 26, 18, 22, 18);
    ctx.bezierCurveTo(18, 18, 15, 22, 15, 25);
    ctx.fill();
  }

  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
};

/**
 * Load image with fallback
 */
export const loadImageWithFallback = (url, type) => {
  return new Promise((resolve) => {
    const img = new Image();

    // Set crossOrigin to try to load external images
    img.crossOrigin = 'anonymous';

    // Timeout after 3 seconds
    const timeout = setTimeout(() => {
      console.warn(`Image load timeout for ${type}, using fallback`);
      resolve(createFallbackImage(type));
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.warn(`Failed to load image for ${type}, using fallback`);
      resolve(createFallbackImage(type));
    };

    img.src = url;
  });
};

/**
 * Load all game images
 */
export const loadGameImages = async () => {
  const [vampire, player, heart] = await Promise.all([
    loadImageWithFallback('https://play.rosebud.ai/assets/Vampire Enemy.png?0u3E', 'vampire'),
    loadImageWithFallback('https://play.rosebud.ai/assets/character_idle.png?Poid', 'player'),
    loadImageWithFallback('https://play.rosebud.ai/assets/heart.png?Cn7I', 'heart'),
  ]);

  return { vampire, player, heart };
};
