// ==========================================
// CONTROLES DE ÁUDIO (Sintetizador Web Audio API)
// ==========================================
let audioCtx = null;
let synthInterval = null;
let isAudioPlaying = false;

// Função para iniciar o sintetizador de música romântica de fundo
function iniciarMusica() {
    if (audioCtx) return;
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Função auxiliar para tocar uma nota com envelope suave
        function tocarNota(frequencia, tempoInicio, duracao, volume = 0.06) {
            if (!audioCtx || audioCtx.state === 'suspended') return;
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const filtro = audioCtx.createBiquadFilter();
            
            osc.connect(filtro);
            filtro.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Onda senoidal misturada com triangular para um som tipo harpa/piano suave
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(frequencia, tempoInicio);
            
            // Filtro passa-baixas para deixar as notas super aveludadas
            filtro.type = 'lowpass';
            filtro.frequency.setValueAtTime(800, tempoInicio);
            filtro.Q.setValueAtTime(1, tempoInicio);
            
            // Envelope de volume: ataque suave e caimento longo de piano
            gainNode.gain.setValueAtTime(0, tempoInicio);
            gainNode.gain.linearRampToValueAtTime(volume, tempoInicio + 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, tempoInicio + duracao);
            
            osc.start(tempoInicio);
            osc.stop(tempoInicio + duracao);
        }
        
        // Progressão harmônica romântica de piano:
        // Cmaj7 (Dó maior com sétima) -> Am9 (Lá menor com nona) -> Fmaj9 (Fá maior com nona) -> G6 (Sol maior com sexta)
        const acordes = [
            [261.63, 329.63, 392.00, 493.88, 523.25], // Cmaj7 (C4, E4, G4, B4, C5)
            [220.00, 261.63, 329.63, 392.00, 587.33], // Am9 (A3, C4, E4, G4, D5)
            [174.61, 261.63, 329.63, 349.23, 523.25], // Fmaj9 (F3, C4, E4, F4, C5)
            [196.00, 293.66, 329.63, 392.00, 493.88]  // G6 (G3, D4, E4, G4, B4)
        ];
        
        let indiceAcorde = 0;
        let passo = 0;
        
        function compasso() {
            if (!audioCtx) return;
            const agora = audioCtx.currentTime;
            const acorde = acordes[indiceAcorde];
            
            // Toca uma nota arpejada a cada pulso
            const notaFreq = acorde[passo % acorde.length];
            
            // Efeito cintilante de oitava alta ocasionalmente
            const oitava = (passo % 8 === 7) ? 2 : 1;
            
            tocarNota(notaFreq * oitava, agora, 2.8, 0.05);
            
            passo++;
            // A cada 8 notas, muda o acorde
            if (passo % 8 === 0) {
                indiceAcorde = (indiceAcorde + 1) % acordes.length;
            }
        }
        
        // Inicia o compasso e cria o intervalo de repetição (480ms por nota)
        compasso();
        synthInterval = setInterval(compasso, 480);
        isAudioPlaying = true;
        atualizarBotaoAudio();
        
    } catch (e) {
        console.error("Erro ao iniciar o sintetizador de áudio:", e);
    }
}

// Parar a reprodução de áudio
function pararMusica() {
    if (synthInterval) {
        clearInterval(synthInterval);
        synthInterval = null;
    }
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
    isAudioPlaying = false;
    atualizarBotaoAudio();
}

// Alternar entre tocar e pausar música
function alternarMusica() {
    if (isAudioPlaying) {
        pararMusica();
    } else {
        iniciarMusica();
    }
}

// Atualizar interface do botão de áudio
function atualizarBotaoAudio() {
    const btn = document.getElementById('btn-audio');
    if (!btn) return;
    if (isAudioPlaying) {
        btn.innerHTML = `<span class="music-icon heart-pulse">💖</span> Música: Ativada`;
        btn.style.background = 'rgba(255, 77, 109, 0.3)';
        btn.style.borderColor = 'rgba(255, 77, 109, 0.6)';
    } else {
        btn.innerHTML = `<span class="music-icon">🎵</span> Música: Desativada`;
        btn.style.background = 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    }
}


// ==========================================
// CANVASES E SISTEMA DE PARTÍCULAS DO CORAÇÃO
// ==========================================
const canvas = document.getElementById('heart-canvas');
const ctx = canvas.getContext('2d');
const surpriseOverlay = document.getElementById('surprise-overlay');
const btnSurpresa = document.getElementById('btn-surpresa');
const btnFechar = document.getElementById('btn-fechar');
const btnAudio = document.getElementById('btn-audio');
const loveLetter = document.getElementById('love-letter');

let particles = [];
let sparkles = [];
let animId = null;
let animActive = false;
let timeElapsed = 0;
let heartAssembled = false;

// Cores românticas vibrantes e elegantes
const coresParticulas = [
    '#ff4d6d', // Rosa choque
    '#ff758f', // Rosa suave
    '#ffccd5', // Pastel claro
    '#ffb3c1', // Rosa marshmallow
    '#ff85a1', // Chiclete
    '#f72585', // Magenta neon
    '#ff0a54'  // Vermelho paixão
];

// Posição e rastreamento do mouse
let mouse = { x: null, y: null, radius: 80 };

window.addEventListener('mousemove', (e) => {
    if (animActive) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Toque em telas móveis
window.addEventListener('touchmove', (e) => {
    if (animActive && e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

// Redimensionamento do canvas
function redimensionarCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (animActive) {
        recalcularAlvos();
    }
}
window.addEventListener('resize', redimensionarCanvas);


// Classe para partículas do texto "i love you"
class Particula {
    constructor(t, r, scaleFactor) {
        this.t = t;
        this.r = r;
        
        // Posição inicial: voam de fora da tela de forma cinematográfica
        const angulo = Math.random() * Math.PI * 2;
        const raio = Math.max(window.innerWidth, window.innerHeight) * (1.1 + Math.random() * 0.4);
        
        this.x = window.innerWidth / 2 + Math.cos(angulo) * raio;
        this.y = window.innerHeight / 2 + Math.sin(angulo) * raio;
        
        // Calcula as Coordenadas Alvo no Coração
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2 - 40;
        
        let xMat = 16 * Math.pow(Math.sin(t), 3);
        let yMat = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        
        let tx = cx + xMat * scaleFactor * r;
        let ty = cy - yMat * scaleFactor * r;
        
        // Adiciona um pouco de ruído aleatório leve para dar volume/textura orgânica
        let ruidoHorizontal = (Math.random() - 0.5) * (scaleFactor * 1.5);
        let ruidoVertical = (Math.random() - 0.5) * (scaleFactor * 1.5);
        
        this.tx = tx + ruidoHorizontal;
        this.ty = ty + ruidoVertical;
        this.baseTx = this.tx;
        this.baseTy = this.ty;
        
        this.vx = 0;
        this.vy = 0;
        
        // Características físicas individuais
        this.tamanho = Math.floor(Math.random() * 6) + 8; // Tamanho 8px a 13px
        this.velocidadeAtracao = Math.random() * 0.035 + 0.025; // Taxa de atração para formação rápida
        this.amortecimento = 0.92;
        this.shimmerSpeed = Math.random() * 0.04 + 0.02;
        this.shimmerPhase = Math.random() * Math.PI * 2;
        
        this.texto = "i love you";
        this.cor = coresParticulas[Math.floor(Math.random() * coresParticulas.length)];
        this.alpha = 0.1; // Começa transparente e ganha brilho
    }

    desenhar() {
        // Efeito shimmer (oscilação sutil de opacidade)
        this.shimmerPhase += this.shimmerSpeed;
        const variacaoAlpha = Math.sin(this.shimmerPhase) * 0.25;
        const alphaFinal = Math.max(0.2, Math.min(1, this.alpha + variacaoAlpha));
        
        ctx.fillStyle = this.cor;
        ctx.globalAlpha = alphaFinal;
        ctx.font = `bold ${this.tamanho}px 'Outfit', sans-serif`;
        
        // Efeito de sombra brilhante na fonte (glow)
        ctx.shadowBlur = this.tamanho / 2;
        ctx.shadowColor = this.cor;
        
        ctx.fillText(this.texto, this.x, this.y);
        
        // Reseta sombra para não impactar outras renderizações
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }

    atualizar(fatorPulso, mouseX, mouseY) {
        // Atualiza a posição alvo de acordo com o batimento cardíaco atual
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2 - 40;
        
        // Move o alvo relativo ao centro, multiplicando pelo fator de pulso
        const dxAlvo = this.baseTx - cx;
        const dyAlvo = this.baseTy - cy;
        this.tx = cx + dxAlvo * fatorPulso;
        this.ty = cy + dyAlvo * fatorPulso;
        
        // Atração magnética para a posição final do coração
        let ax = (this.tx - this.x) * this.velocidadeAtracao;
        let ay = (this.ty - this.y) * this.velocidadeAtracao;
        
        this.vx += ax;
        this.vy += ay;
        this.vx *= this.amortecimento;
        this.vy *= this.amortecimento;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Fazer a opacidade subir gradualmente enquanto viajam
        if (this.alpha < 0.85) {
            this.alpha += 0.005;
        }

        // Interação com o Mouse / Dedo (Repulsão interativa)
        if (mouseX !== null && mouseY !== null) {
            let mdx = this.x - mouseX;
            let mdy = this.y - mouseY;
            let mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            
            if (mdist < mouse.radius) {
                // Força de empurrão inversamente proporcional à distância
                let forca = (mouse.radius - mdist) / mouse.radius;
                let angulo = Math.atan2(mdy, mdx);
                
                // Aplica repulsão instantânea leve
                this.x += Math.cos(angulo) * forca * 6;
                this.y += Math.sin(angulo) * forca * 6;
                
                // Cria faíscas ao passar o mouse
                if (Math.random() < 0.08) {
                    sparkles.push(new Faisca(this.x, this.y, this.cor));
                }
            }
        }
    }
}

// Classe de partículas extras de faíscas que saem do coração no batimento ou toque
class Faisca {
    constructor(x, y, cor) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - Math.random() * 2; // sobem levemente
        this.cor = cor;
        this.tamanho = Math.random() * 3 + 1;
        this.vida = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
    }

    atualizar() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.02; // gravidade sutil descendo
        this.vida -= this.decay;
    }

    desenhar() {
        ctx.fillStyle = this.cor;
        ctx.globalAlpha = this.vida;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.tamanho, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// Inicializa a lista de partículas desenhando a forma matemática do coração preenchido
function inicializarCoraçao() {
    particles = [];
    sparkles = [];
    heartAssembled = false;
    timeElapsed = 0;
    
    // Determina o tamanho do coração dinamicamente baseado na tela
    const larguraTela = window.innerWidth;
    const alturaTela = window.innerHeight;
    const scaleFactor = Math.min(larguraTela, alturaTela) / 42; // tamanho perfeito e adaptável
    
    // Aumentamos consideravelmente o total de partículas para 1200 para ficar incrivelmente cheio e denso
    const totalParticulas = 1200;
    
    for (let i = 0; i < totalParticulas; i++) {
        let t, r;
        
        if (i < 400) {
            // As primeiras 400 formam uma borda externa ultra nítida e definida
            t = (i / 400) * Math.PI * 2;
            r = 1.0;
        } else {
            // As outras 800 preenchem densamente todo o interior do coração de forma uniforme
            t = Math.random() * Math.PI * 2;
            r = Math.sqrt(Math.random()) * 0.96; // Distribuição uniforme de área de coração
        }
        
        particles.push(new Particula(t, r, scaleFactor));
    }
}

// Recalcular alvos do coração caso a janela mude de tamanho durante a execução
function recalcularAlvos() {
    const larguraTela = window.innerWidth;
    const alturaTela = window.innerHeight;
    const scaleFactor = Math.min(larguraTela, alturaTela) / 42;
    
    const cx = larguraTela / 2;
    const cy = alturaTela / 2 - 40;
    
    particles.forEach((p) => {
        let xMat = 16 * Math.pow(Math.sin(p.t), 3);
        let yMat = 13 * Math.cos(p.t) - 5 * Math.cos(2*p.t) - 2 * Math.cos(3*p.t) - Math.cos(4*p.t);
        
        let tx = cx + xMat * scaleFactor * p.r;
        let ty = cy - yMat * scaleFactor * p.r;
        
        // Preserva o ruído individual
        let ruidoHorizontal = (Math.random() - 0.5) * (scaleFactor * 1.5);
        let ruidoVertical = (Math.random() - 0.5) * (scaleFactor * 1.5);
        
        p.baseTx = tx + ruidoHorizontal;
        p.baseTy = ty + ruidoVertical;
    });
}

// Loop principal de renderização e física
function loopAnimacao(timestamp) {
    if (!animActive) return;
    
    // Fundo preto puro (redesenha limpando o frame anterior)
    ctx.fillStyle = '#0a090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    timeElapsed += 16.67; // Aproximação de 60fps em ms
    
    // Cálculo do Batimento Cardíaco de Duplo Estágio (Lub-Dub)
    // O batimento só fica ativo após 4 segundos (tempo do coração se juntar gradualmente)
    let fatorPulso = 1.0;
    
    if (timeElapsed > 2200) {
        heartAssembled = true;
        
        // Ciclo do batimento dura 1200ms
        let tempoCiclo = Math.floor(timeElapsed) % 1250;
        
        if (tempoCiclo < 150) {
            // Primeiro pico (Lub) - Expande 12%
            fatorPulso = 1 + 0.12 * Math.sin((tempoCiclo / 150) * Math.PI);
        } else if (tempoCiclo >= 150 && tempoCiclo < 280) {
            // Repouso curto
            fatorPulso = 1.0;
        } else if (tempoCiclo >= 280 && tempoCiclo < 430) {
            // Segundo pico (Dub) - Expande 8%
            fatorPulso = 1 + 0.08 * Math.sin(((tempoCiclo - 280) / 150) * Math.PI);
        } else {
            // Repouso longo
            fatorPulso = 1.0;
        }
        
        // Disparar faíscas decorativas nos picos da batida do coração
        if ((tempoCiclo > 10 && tempoCiclo < 30) || (tempoCiclo > 290 && tempoCiclo < 310)) {
            if (Math.random() < 0.45) {
                // Pega uma partícula aleatória e cria uma faísca a partir dela
                const pAleatoria = particles[Math.floor(Math.random() * particles.length)];
                sparkles.push(new Faisca(pAleatoria.x, pAleatoria.y, pAleatoria.cor));
            }
        }
        
        // Revelar a carta de amor gradualmente após a formação total (cerca de 4.0s)
        if (timeElapsed > 4000 && loveLetter.classList.contains('hidden')) {
            loveLetter.classList.remove('hidden');
            // Timeout curto para garantir que a transição de opacidade CSS dispare
            setTimeout(() => {
                loveLetter.classList.add('visible');
            }, 100);
        }
    }
    
    // Atualizar e desenhar partículas
    particles.forEach(p => {
        p.atualizar(fatorPulso, mouse.x, mouse.y);
        p.desenhar();
    });
    
    // Atualizar e desenhar faíscas brilhantes
    for (let i = sparkles.length - 1; i >= 0; i--) {
        sparkles[i].atualizar();
        if (sparkles[i].vida <= 0) {
            sparkles.splice(i, 1);
        } else {
            sparkles[i].desenhar();
        }
    }
    
    animId = requestAnimationFrame(loopAnimacao);
}

// Iniciar a exibição da surpresa romântica
function abrirSurpresa() {
    redimensionarCanvas();
    inicializarCoraçao();
    
    // Exibe overlay
    surpriseOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // impede scroll da página de trás
    
    animActive = true;
    animId = requestAnimationFrame(loopAnimacao);
    
    // Inicia a melodia romântica automaticamente (respeitando interação do clique)
    iniciarMusica();
}

// Fechar a surpresa e retornar à página inicial
function fecharSurpresa() {
    animActive = false;
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    
    // Esconde overlay e carta
    surpriseOverlay.classList.add('hidden');
    loveLetter.classList.add('hidden');
    loveLetter.classList.remove('visible');
    
    document.body.style.overflow = 'auto'; // devolve scroll
    
    // Para a música para não ficar tocando eternamente
    pararMusica();
}


// ==========================================
// REGISTRO DE EVENTOS (LISTENERS)
// ==========================================
btnSurpresa.addEventListener('click', abrirSurpresa);
btnFechar.addEventListener('click', fecharSurpresa);
btnAudio.addEventListener('click', alternarMusica);

// Prevenção extra para o botão de fechar funcionar perfeitamente em mobile
btnFechar.addEventListener('touchstart', (e) => {
    e.preventDefault();
    fecharSurpresa();
}, { passive: false });
