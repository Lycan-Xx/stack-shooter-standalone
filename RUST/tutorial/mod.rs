// ═══════════════════════════════════════════════════════════════════════════
//  tutorial/mod.rs  —  mirrors tutorial.js
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone)]
pub struct TutorialState {
    pub step:     usize,
    pub visible:  bool,
}

pub const STEPS: &[&str] = &[
    "Welcome, Hunter! 🧛\n\nVampires are attacking!\nUse WASD or Arrow Keys to move around.",
    "Great! Now learn to shoot.\nAim with the mouse and CLICK to fire!",
    "Excellent! Now the most important skill: DASHING!\nPress SPACEBAR — you're invincible while dashing!",
    "Remember: vampires can't hurt you while dashing.\nUse it to escape when surrounded!\nDefeat this wave to continue.",
    "You're ready! 🌟\n\nTips:\n- Watch your health (top left)\n- Dash has cooldown (bottom)\n- Kill vampires for points\n\nGood luck, Hunter!",
];

impl TutorialState {
    pub fn new() -> Self { Self { step: 0, visible: true } }

    pub fn current_text(&self) -> &'static str {
        STEPS.get(self.step).copied().unwrap_or("")
    }

    /// Advance to next step; returns false when tutorial is complete.
    pub fn advance(&mut self) -> bool {
        self.step += 1;
        if self.step >= STEPS.len() {
            self.visible = false;
            false
        } else {
            true
        }
    }

    pub fn is_complete(&self) -> bool { self.step >= STEPS.len() }
}