import { Character, StageData, Platform, Difficulty } from '../types';
import { sound } from './audio';

export interface GameKeys {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  ultimate: boolean;
  fever?: boolean;
}

export class Fighter {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = 40;
  height: number = 80;
  color: string;
  isGrounded: boolean = false;
  health: number = 100;
  facingRight: boolean = true;
  isAttacking: boolean = false;
  attackTimer: number = 0;
  attackType: 'punch' | 'kick' | 'spin' = 'punch';
  stats: Character['stats'];
  fashion: Character['fashion'];
  hitCooldown: number = 0;
  stateTimer: number = 0;

  // Special & Ultimate
  specialMeter: number = 0;
  isUltimate: boolean = false;
  ultimateTimer: number = 0;

  // Combo System
  combo: number = 0;
  maxCombo: number = 0;
  comboTimer: number = 0;

  // AI State
  aiState: 'idle' | 'approach' | 'retreat' | 'attack' = 'idle';
  aiTimer: number = 0;

  constructor(x: number, y: number, char: Character, facingRight: boolean) {
    this.x = x;
    this.y = y;
    this.color = char.color;
    this.stats = char.stats;
    this.fashion = char.fashion;
    this.facingRight = facingRight;
  }

  update(keys: GameKeys, platforms: Platform[], isAI: boolean, opponent?: Fighter, difficulty: Difficulty = 'NORMAL', isFever: boolean = false) {
    if (this.health <= 0) return;

    if (isFever && !isAI) {
      this.specialMeter = 100; // Infinite ultimate during fever
    }

    this.stateTimer++;

    // AI Logic
    if (isAI && opponent) {
      const dx = opponent.x - this.x;
      const dy = opponent.y - this.y;
      const dist = Math.abs(dx);
      
      // Reset keys
      keys.left = false;
      keys.right = false;
      keys.jump = false;
      keys.attack = false;
      keys.ultimate = false;

      // AI Ultimate Logic
      if (this.specialMeter >= 100) {
        const isFacingOpponent = (dx > 0 && this.facingRight) || (dx < 0 && !this.facingRight);
        if (isFacingOpponent && Math.abs(dy) < 50 && dist < 600) {
          if (difficulty === 'INSANITY' || (difficulty === 'HARD' && Math.random() < 0.1) || Math.random() < 0.02) {
            keys.ultimate = true;
          }
        }
      }

      this.aiTimer--;

      if (this.aiTimer <= 0) {
        let reactionTime = 30;
        let attackChance = 0.5;
        let retreatChance = 0.1;

        switch (difficulty) {
          case 'EASY':
            reactionTime = 80; // Very slow, predictable
            attackChance = 0.1; // Rarely attacks
            retreatChance = 0.7; // Constantly runs away
            break;
          case 'NORMAL':
            reactionTime = 40;
            attackChance = 0.4;
            retreatChance = 0.3;
            break;
          case 'HARD':
            reactionTime = 15;
            attackChance = 0.8;
            retreatChance = 0.05;
            break;
          case 'INSANITY':
            reactionTime = 2; // Lightning fast, reads inputs
            attackChance = 1.0; // Always attacks when in range
            retreatChance = 0.0;
            break;
        }

        this.aiTimer = reactionTime + Math.random() * (reactionTime * 0.5);

        if (dist < 70) {
          if (Math.random() < attackChance) {
            this.aiState = 'attack';
          } else if (Math.random() < retreatChance) {
            this.aiState = 'retreat';
          } else {
            this.aiState = 'idle';
          }
        } else {
          if (Math.random() < retreatChance && difficulty === 'EASY') {
            this.aiState = 'retreat'; // Force retreat on easy
          } else {
            this.aiState = 'approach';
          }
        }
      }

      // Execute AI State
      if (this.aiState === 'approach') {
        if (dx > 20) keys.right = true;
        else if (dx < -20) keys.left = true;

        // Jump if opponent is higher, or randomly on harder difficulties to close gap
        if (dy < -40 && Math.random() < (difficulty === 'INSANITY' ? 0.3 : 0.05)) keys.jump = true;
        if (difficulty === 'INSANITY' && dist > 200 && Math.random() < 0.05) keys.jump = true;
      } else if (this.aiState === 'retreat') {
        if (dx > 0) keys.left = true;
        else keys.right = true;
      } else if (this.aiState === 'attack') {
        if (dx > 10) keys.right = true;
        else if (dx < -10) keys.left = true;
        
        if (dist < 60) {
           keys.attack = true;
           if (difficulty === 'INSANITY' && Math.random() < 0.4) keys.jump = true;
        } else {
           this.aiState = 'approach';
        }
      }

      // Defensive jumping (dodging)
      if (opponent.isAttacking && dist < 100) {
         if (difficulty === 'NORMAL' && Math.random() < 0.1) keys.jump = true;
         if (difficulty === 'HARD' && Math.random() < 0.4) keys.jump = true;
         if (difficulty === 'INSANITY' && Math.random() < 0.9) {
             keys.jump = true;
             this.aiState = 'retreat'; // Dodge and weave
         }
      }
    }

    // Movement
    const speed = isFever && !isAI ? this.stats.speed * 1.5 : this.stats.speed * 0.6; // Slower, more relaxing pace
    if (keys.left) {
      this.vx = -speed;
      this.facingRight = false;
    } else if (keys.right) {
      this.vx = speed;
      this.facingRight = true;
    } else {
      this.vx = 0;
    }

    // Jump
    if (keys.jump && this.isGrounded) {
      this.vy = -(10 + this.stats.jump * 0.4); // Lower jump
      this.isGrounded = false;
      if (!isAI) sound.playJump();
    }

    // Auto-charge special when low health (Rage mechanic)
    if (this.health <= 30 && this.specialMeter < 100) {
      this.specialMeter = Math.min(100, this.specialMeter + 0.2);
    }

    // Ultimate
    if (keys.ultimate && this.specialMeter >= 100 && this.ultimateTimer <= 0 && this.attackTimer <= 0) {
      this.isUltimate = true;
      this.ultimateTimer = 45; // 45 frames of ultimate beam
      this.specialMeter = 0;
      this.hitCooldown = 45; // Invincible during ultimate
      this.vx = 0; // Stop moving
      sound.playUltimate();
    }

    if (this.ultimateTimer > 0) {
      this.ultimateTimer--;
      if (this.ultimateTimer === 0) this.isUltimate = false;
    }

    // Attack
    if (keys.attack && this.attackTimer <= 0 && this.ultimateTimer <= 0 && this.hitCooldown <= 0) {
      this.isAttacking = true;
      this.attackTimer = 20; // slightly longer frames for relaxing pace
      const attacks: ('punch' | 'kick' | 'spin')[] = ['punch', 'kick', 'spin'];
      this.attackType = attacks[Math.floor(Math.random() * attacks.length)];
      if (!isAI) sound.playAttack();
    }

    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0) this.isAttacking = false;
    }

    if (this.hitCooldown > 0) {
      this.hitCooldown--;
    }

    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) this.combo = 0;
    }

    // Physics
    this.vy += 0.5; // Gravity (slower floatier)
    this.x += this.vx;
    this.y += this.vy;

    // Floor collision
    if (this.y + this.height > 550) {
      this.y = 550 - this.height;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Platform collision
    for (const p of platforms) {
      if (
        this.vy > 0 && 
        this.y + this.height - this.vy <= p.y && 
        this.y + this.height >= p.y && 
        this.x + this.width > p.x &&
        this.x < p.x + p.w
      ) {
        this.y = p.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // Screen bounds
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > 800) this.x = 800 - this.width;

    // Combat Collision
    if (this.isUltimate && opponent && opponent.hitCooldown === 0) {
      // Massive beam hitbox
      const attackRange = 800;
      const attackX = this.facingRight ? this.x + this.width : this.x - attackRange;
      
      if (
        attackX < opponent.x + opponent.width &&
        attackX + attackRange > opponent.x &&
        this.y - 40 < opponent.y + opponent.height &&
        this.y + this.height + 40 > opponent.y
      ) {
        opponent.health -= this.stats.power * 4; // Massive damage
        opponent.hitCooldown = 30;
        opponent.vx = this.facingRight ? 25 : -25;
        opponent.vy = -10;
        opponent.specialMeter = Math.min(100, opponent.specialMeter + 20);
        sound.playHit();
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.comboTimer = 120;
      }
    } else if (this.isAttacking && opponent && opponent.hitCooldown === 0) {
      const attackRange = 40;
      const attackX = this.facingRight ? this.x + this.width : this.x - attackRange;
      
      if (
        attackX < opponent.x + opponent.width &&
        attackX + attackRange > opponent.x &&
        this.y < opponent.y + opponent.height &&
        this.y + this.height > opponent.y
      ) {
        opponent.health -= this.stats.power * 2;
        opponent.hitCooldown = 20;
        opponent.vx = this.facingRight ? 10 : -10;
        opponent.vy = -5;
        
        // Gain meter on hit
        this.specialMeter = Math.min(100, this.specialMeter + 15);
        opponent.specialMeter = Math.min(100, opponent.specialMeter + 10);
        sound.playHit();
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.comboTimer = 120;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Center of the fighter
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    
    ctx.translate(cx, cy);
    
    // Spin attack rotation
    if (this.isAttacking && this.attackType === 'spin') {
      const spinAngle = (this.stateTimer * 0.5) % (Math.PI * 2);
      ctx.rotate(spinAngle);
    }
    
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    if (this.hitCooldown > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Aura for Rage / Full Meter
    if (this.specialMeter >= 100) {
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 15;
    } else if (this.health <= 30) {
      ctx.shadowColor = '#f00';
      ctx.shadowBlur = 15;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Animation parameters
    const t = this.stateTimer * 0.05;
    let headY = -30;
    let leftArmAngle = Math.PI / 2 + 0.3;
    let rightArmAngle = Math.PI / 2 - 0.3;
    let leftLegAngle = Math.PI / 2 + 0.2;
    let rightLegAngle = Math.PI / 2 - 0.2;
    let kneeBend = 0.1;
    let elbowBend = -0.2;

    if (this.hitCooldown > 0) {
      headY = -20;
      leftArmAngle = Math.PI;
      rightArmAngle = 0;
      leftLegAngle = Math.PI / 2 + 0.5;
      rightLegAngle = Math.PI / 2 - 0.5;
    } else if (this.isUltimate) {
      rightArmAngle = 0; // Straight right
      leftArmAngle = Math.PI; // Straight left
      elbowBend = 0;
    } else if (this.isAttacking) {
      if (this.attackType === 'punch') {
        rightArmAngle = 0; // Straight right
        leftArmAngle = Math.PI; // Straight left
        elbowBend = 0;
      } else if (this.attackType === 'kick') {
        rightLegAngle = 0; // Straight right
        kneeBend = 0;
        rightArmAngle = -Math.PI / 2; // Up
      }
    } else if (Math.abs(this.vx) > 0.5 && this.vy === 0) {
      // Walking
      leftLegAngle = Math.PI / 2 + Math.sin(t) * 0.8;
      rightLegAngle = Math.PI / 2 + Math.sin(t + Math.PI) * 0.8;
      leftArmAngle = Math.PI / 2 + Math.sin(t + Math.PI) * 0.8;
      rightArmAngle = Math.PI / 2 + Math.sin(t) * 0.8;
      headY = -30 + Math.abs(Math.sin(t * 2)) * 3;
    } else if (this.vy !== 0) {
      // Jumping
      leftLegAngle = Math.PI / 2 + 0.5;
      rightLegAngle = Math.PI / 2 - 0.5;
      leftArmAngle = -Math.PI / 4;
      rightArmAngle = -Math.PI * 3 / 4;
    }

    // Build Stickman Path
    const path = new Path2D();
    
    // Head
    path.moveTo(12, headY);
    path.arc(0, headY, 12, 0, Math.PI * 2);

    // Torso
    path.moveTo(0, headY + 12);
    path.lineTo(0, 10); // Pelvis

    // Helper for limbs
    const addLimb = (startX: number, startY: number, angle: number, length: number, bendAngle: number, bendLength: number) => {
      const mx = startX + Math.cos(angle) * length;
      const my = startY + Math.sin(angle) * length;
      const ex = mx + Math.cos(angle + bendAngle) * bendLength;
      const ey = my + Math.sin(angle + bendAngle) * bendLength;
      path.moveTo(startX, startY);
      path.lineTo(mx, my);
      path.lineTo(ex, ey);
    };

    // Arms (from neck)
    addLimb(0, headY + 15, leftArmAngle, 15, elbowBend, 15);
    addLimb(0, headY + 15, rightArmAngle, 15, -elbowBend, 15);

    // Legs (from pelvis)
    addLimb(0, 10, leftLegAngle, 20, kneeBend, 20);
    addLimb(0, 10, rightLegAngle, 20, kneeBend, 20);

    // 1. Drop shadow / 3D depth with parallax
    // Shadow offset changes based on character's facing direction and slight movement
    const shadowOffsetX = this.facingRight ? -6 : 6;
    const shadowOffsetY = 6 + (this.vy * 0.2); // Shadow moves slightly when jumping
    
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.save();
    ctx.translate(shadowOffsetX, shadowOffsetY);
    ctx.stroke(path);
    ctx.restore();

    // 2. Main color (Gradient)
    const grad = ctx.createLinearGradient(0, -50, 0, 50);
    grad.addColorStop(0, '#ffffff'); // slight highlight at top
    grad.addColorStop(0.3, this.color);
    grad.addColorStop(1, '#111111'); // darken at bottom

    ctx.lineWidth = 8;
    ctx.strokeStyle = grad;
    ctx.stroke(path);

    // 3. Inner highlight (tube effect)
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke(path);

    // Draw Ultimate Beam
    if (this.isUltimate) {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = Math.min(1, this.ultimateTimer / 10);
      
      // Beam core
      ctx.fillRect(20, -40, 800, 80);
      
      // Beam inner highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, -20, 800, 40);
      
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Fashion
    if (this.fashion === 'bandana') {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-12, headY - 8, 24, 4);
      ctx.fillRect(-18, headY - 8, 6, 12);
    } else if (this.fashion === 'tophat') {
      ctx.fillStyle = '#222';
      ctx.fillRect(-16, headY - 12, 32, 4);
      ctx.fillRect(-10, headY - 30, 20, 18);
    } else if (this.fashion === 'shades') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-2, headY - 3, 14, 5);
    } else if (this.fashion === 'crown') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-12, headY - 12);
      ctx.lineTo(12, headY - 12);
      ctx.lineTo(16, headY - 25);
      ctx.lineTo(6, headY - 17);
      ctx.lineTo(0, headY - 27);
      ctx.lineTo(-6, headY - 17);
      ctx.lineTo(-16, headY - 25);
      ctx.fill();
    } else if (this.fashion === 'headphones') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, headY, 14, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(-16, headY, 4, 8);
      ctx.fillRect(12, headY, 4, 8);
    } else if (this.fashion === 'halo') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, headY - 20, 10, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.fashion === 'horns') {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(-8, headY - 10);
      ctx.lineTo(-12, headY - 20);
      ctx.lineTo(-4, headY - 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, headY - 10);
      ctx.lineTo(12, headY - 20);
      ctx.lineTo(4, headY - 10);
      ctx.fill();
    } else if (this.fashion === 'cape') {
      ctx.fillStyle = '#800080';
      ctx.beginPath();
      ctx.moveTo(-5, headY + 15);
      ctx.lineTo(-25, headY + 45);
      ctx.lineTo(-15, headY + 50);
      ctx.lineTo(0, headY + 15);
      ctx.fill();
    } else if (this.fashion === 'scarf') {
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(-8, headY + 10, 16, 6);
      ctx.beginPath();
      ctx.moveTo(-8, headY + 15);
      ctx.lineTo(-20, headY + 25);
      ctx.lineTo(-15, headY + 30);
      ctx.lineTo(-5, headY + 15);
      ctx.fill();
    }

    ctx.restore();

    // Draw Combo Counter above the player
    if (this.combo > 1) {
      ctx.save();
      ctx.fillStyle = '#ffaa00';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
      const bounce = Math.sin(this.comboTimer * 0.5) * 5;
      ctx.fillText(`${this.combo} HIT COMBO!`, this.x + this.width / 2, this.y - 20 + bounce);
      ctx.restore();
    }
  }
}
