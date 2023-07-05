const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var stats = new Stats();
stats.showPanel(0);
document.body.appendChild( stats.dom );


import('https://webr.r-wasm.org/latest/webr.mjs').then(async ({ WebR }) => {
  const webR = new WebR();

  async function clearPlot(){
    await webR.evalRVoid(`
      plot(0, bg="black", xlim=c(-2.5, 2.5), ylim=c(-2.5, 2.5), type="n", axes=F, xlab ="", ylab="")
    `);
  }

  await webR.init();

  document.getElementById('loading').remove();
  canvas.style.display = 'block';

  const gui = new dat.GUI();
  var params = { a: -1.24, b: -1.25, c: -1.7, d: -1.9 };
  var settings = { Iterations: 1000, Alpha: 0.1, Colour: true };
  gui.add(params, 'a', -3, 3, 0.1).onChange(() => {
    webR.objs.globalEnv.bind('param', Object.values(params));
    clearPlot();
  });
  gui.add(params, 'b', -3, 3, 0.1).onChange(() => {
    webR.objs.globalEnv.bind('param', Object.values(params));
    clearPlot();
  });
  gui.add(params, 'c', -3, 3, 0.1).onChange(() => {
    webR.objs.globalEnv.bind('param', Object.values(params));
    clearPlot();
  });
  gui.add(params, 'd', -3, 3, 0.1).onChange(() => {
    webR.objs.globalEnv.bind('param', Object.values(params));
    clearPlot();
  });
  gui.add(settings, 'Iterations', [100, 1000, 10000]).onChange(async () => {
    const iter = Number(settings.Iterations);
    await webR.objs.globalEnv.bind('iter', iter);
    await webR.evalRVoid(`
      state <- matrix(nrow=iter, ncol=2)
      col <- character(iter)
    `);
    clearPlot();
  });
  gui.add(settings, 'Colour').onChange(() => {
    webR.objs.globalEnv.bind('colour', settings.Colour);
    clearPlot();
  });
  gui.add(settings, 'Alpha', 0, 0.3, 0.01).onChange(async () => {
    await webR.objs.globalEnv.bind('alpha', settings.Alpha);
    await webR.evalRVoid('map <- rainbow(100, alpha=alpha)');
    clearPlot();
  });

  await webR.evalRVoid(`webr::canvas(bg="black")`);
  await clearPlot();

  await webR.evalRVoid(`
seed <- 0
res <- 1024
iter <- 1000
colour <- TRUE
alpha <- 0.1
param <- c(-1.24, -1.25, -1.7, -1.9)
state <- matrix(nrow=iter, ncol=2)
col <- character(iter)
map <- rainbow(100, alpha=alpha)

attr <- function (param) {
  state[1, ] <- rnorm(2)
  col[1] <- "#FFFFFF00"
  for (n in 1:(iter-1)) {
    state[n+1,] <- c(
      sin(param[1]*state[n, 2]) + param[3]*cos(param[1]*state[n, 1]),
      sin(param[2]*state[n, 1]) + param[4]*cos(param[2]*state[n, 2])
    )
    if (colour) {
      diff <- 50*(1 + atan2(state[n+1,2] - state[n,2], state[n+1,1] - state[n,1])/pi)
      col[n+1] <- map[round(diff) + 1]
    } else {
      col[n+1] <- rgb(1, 1, 1, alpha)
    }
  }
  points(state, pch=20, cex=0.1, col=col)
}
`);

  draw = async () => {
    stats.begin();
    await webR.evalRVoid('attr(param)');
    stats.end();
    requestAnimationFrame(draw);
  }
  draw();

  (async () => {
    for (;;) {
      const output = await webR.read();
      switch (output.type) {
        case 'stdout':
          console.log(output.data);
          break;
        case 'stderr':
          console.error(output.data);
          break;
        case 'canvasImage':
          ctx.drawImage(output.data.image, 0, 0);
          break;
      }
    }
  })();
});