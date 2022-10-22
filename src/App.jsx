import axios from "axios";
import React, { useEffect, useState } from "react";
import "./App.css";
import { IMAGE_HEIGHT, IMAGE_WIDTH, STABLE_DIFFUSION_URL } from "./constants";
import { Buffer } from "buffer";

let prevMouseX,
  prevMouseY,
  snapshot,
  selectedTool = "brush",
  brushWidth = 5,
  isDrawing,
  canvas,
  ctx,
  color = "#000000";
let undo = [],
  redo = [];

function setIsDrawing(value) {
  isDrawing = value;
}

function setCanvas(value) {
  canvas = value;
}

function setCtx(value) {
  ctx = value;
}

function App() {
  const [generating, setGenerating] = useState(false);
  const [size, setSize] = useState(5);
  const [prompt, setPrompt] = useState("");
  const [tiling, setTiling] = useState(false);
  const [strength, setStrength] = useState(50);
  const [swatch, setSwatch] = useState(color);
  const [undoEnable, setUndoEnable] = useState(false);
  const [redoEnable, setRedoEnable] = useState(false);
  const [maskOn, setMaskOn] = useState(false);
  const [normalImage, setNormalImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);

  //  var history = {
  //     redo_list: [],
  //     undo_list: [],
  //     saveState: function(canvas, list, keep_redo) {
  //       keep_redo = keep_redo || false;
  //       if(!keep_redo) {
  //         this.redo_list = [];
  //       }

  //       (list || this.undo_list).push(canvas.toDataURL());
  //     },
  //     undo: function(canvas, ctx) {
  //       this.restoreState(canvas, ctx, this.undo_list, this.redo_list);
  //     },
  //     redo: function(canvas, ctx) {
  //       this.restoreState(canvas, ctx, this.redo_list, this.undo_list);
  //     },
  //     restoreState: function(canvas, ctx,  pop, push) {
  //       if(pop.length) {
  //         this.saveState(canvas, push, true);
  //         var restore_state = pop.pop();
  //         var img = new Element('img', {'src':restore_state});
  //         img.onload = function() {
  //           ctx.clearRect(0, 0, 600, 400);
  //           ctx.drawImage(img, 0, 0, 600, 400, 0, 0, 600, 400);
  //         }
  //       }
  //     }
  //   }

  function setColor(value) {
    color = value;
    setSwatch(value);
  }

  function getOffsetPosition(evt, parent) {
    var position = {
      x: evt.targetTouches ? evt.targetTouches[0].pageX : evt.clientX,
      y: evt.targetTouches ? evt.targetTouches[0].pageY : evt.clientY,
    };

    // while (parent.offsetParent) {
    position.x -= parent.offsetLeft - document.querySelector("html").scrollLeft;
    position.y -= parent.offsetTop - document.querySelector("html").scrollTop;
    //   parent = parent.offsetParent;
    // }

    return position;
  }

  const drawRect = (offsetX, offsetY) => {
    ctx.fillRect(offsetX, offsetY, prevMouseX - offsetX, prevMouseY - offsetY);
  };

  const drawCircle = (offsetX, offsetY) => {
    ctx.beginPath(); //creating a new path to draw circle
    // getting radius for circle according to the mouse pointer
    let radius = Math.sqrt(
      Math.pow(prevMouseX - offsetX, 2) + Math.pow(prevMouseY - offsetY, 2)
    );
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI); //creating circle according to the mouse pointer
    ctx.stroke();
    ctx.fill(); //if fillColor is checked fill circle else draw border circle
  };

  const drawTriangle = (offsetX, offsetY) => {
    ctx.beginPath(); //creating new path to draw circle
    ctx.moveTo(prevMouseX, prevMouseY); // moving triangle to the mouse pointer
    ctx.lineTo(offsetX, offsetY); // creating first line according to the mouse pointer
    ctx.lineTo(prevMouseX * 2 - offsetX, offsetY); // creating bottom line of the triangle
    ctx.closePath(); // closing path of the triangle so the third line draw automatically
    ctx.stroke();
    ctx.fill(); //if fillColor is checked fill circle else draw border triangle
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    // get canvas

    const position = getOffsetPosition(e, e.target);
    setIsDrawing(true);
    prevMouseX = position.x; //passing current MouseX position as prevMouseX value
    prevMouseY = position.y; //passing current MouseY position as prevMouseY value
    ctx.beginPath(); //creating new path to draw
    ctx.lineWidth = brushWidth; //passing brushSize as line width
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); //coping canvas data and passing as snapshot value.. this avoids dragging the image
    // undo.push(snapshot);
    // setUndoEnable(true);
    // setRedoEnable(false);
    // redo = [];
    // console.log("undo", undo)
    ctx.strokeStyle = color; // passing selectedColor as stroke syle
    ctx.fillStyle = color; // passing selectedColor as fill style
  };

  const drawing = (e) => {
    if (!isDrawing) return console.log("not drawing");
    //if isDrawing is flase return form here
    else console.log("drawing");
    const position = getOffsetPosition(e, e.target);
    ctx.putImageData(snapshot, 0, 0); //adding the copied canvas on to this canvas

    if (selectedTool === "brush" || selectedTool === "eraser") {
      ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : color; //if selected tool is eraser then set strokeStyle to white to paint white color onto the existing canvas content else set the stroke color to selected color
      ctx.lineTo(position.x, position.y); //creating line according to the mouse pointer
      ctx.stroke(); //drawin/filling line with color
    } else if (selectedTool === "rectangle") {
      drawRect(position.x, position.y);
    } else if (selectedTool === "circle") {
      drawCircle(position.x, position.y);
    } else {
      drawTriangle(position.x, position.y);
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); //coping canvas data and passing as snapshot value.. this avoids dragging the image
    undo.push(snapshot);
    setUndoEnable(true);
    setRedoEnable(false);
    redo = [];
    console.log("undo", undo);
  };

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    setCanvas(canvas);
    setCtx(ctx);

    // if we're on mobile, set canvas width and height to 256px
    if (window.innerWidth < 520) {
      canvas.width = 256;
      canvas.height = 256;
    }
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    ctx.fillStyle = "#FFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // global variables with default values
    setIsDrawing(false);
    // if the window size changes, resize the canvas
    // window.addEventListener("resize", () => {
    //   canvas.width = window.innerWidth;
    //   canvas.height = window.innerHeight;
    // });

    const toolBtns = document.querySelectorAll(".tool");

    toolBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        //adding click event to all tool option
        // removing active class from the pervious option and adding on current clicked option
        document.querySelector(".options .active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
      });
    });

    const sizeSlider = document.querySelector("#size-slider");

    sizeSlider.addEventListener(
      "change",
      () => (brushWidth = sizeSlider.value)
    );

    const colorPicker = document.querySelectorAll("#color-picker")[0];

    colorPicker.addEventListener("change", () => {
      colorPicker.parentElement.click();
    });

    canvas.addEventListener("touchstart", startDraw);
    canvas.addEventListener("touchmove", drawing);
    canvas.addEventListener("touchend", endDrawing);
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", drawing);
    canvas.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("mouseout", () => {
      setIsDrawing(false);
    });
  }, []);

  useEffect(() => {
    console.log("length", undo, redo);
  });

  const clearCanvas = () => {
    if (generating) {
      return;
    }

    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const resizeImage = (url, width, height, callback) => {
    var sourceImage = new Image();

    sourceImage.onload = function () {
      let canvas;
      if (document.getElementById("temp_canvas")) {
        canvas = document.getElementById("temp_canvas");
      } else {
        canvas = document.createElement("canvas");
      }
      canvas.width = width;
      canvas.height = height;

      if (!maskOn) {
        canvas.getContext("2d").fillStyle = "#FFFF";
        canvas.getContext("2d").fillRect(0, 0, canvas.width, canvas.height);
      }
      canvas.getContext("2d").drawImage(sourceImage, 0, 0, width, height);

      callback(canvas.toDataURL());
    };

    sourceImage.src = url;
    sourceImage.background;
  };

  const saveImage = () => {
    if (generating) {
      return;
    }

    const canvas = document.querySelector("canvas");
    resizeImage(
      canvas.toDataURL(),
      canvas.width,
      canvas.height,
      (sizeUpdatedDataURL) => {
        const link = document.createElement("a");
        link.download = "image.png";
        link.href = sizeUpdatedDataURL;
        link.click();
      }
    );
  };

  const uploadImage = () => {
    if (generating) {
      return;
    }

    if (!maskOn) {
      setMaskPressed();
    }

    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
          undo = [];
          undo.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
  };

  const generateImage = () => {
    try {
      if (generating) {
        return;
      }

      setGenerating(true);
      const canvas = document.querySelector("canvas");
      const ctx = canvas.getContext("2d");

      resizeImage(
        canvas.toDataURL(),
        IMAGE_WIDTH,
        IMAGE_HEIGHT,
        async (sizeUpdatedDataURL) => {
          const response = await axios.post(
            STABLE_DIFFUSION_URL,
            sizeUpdatedDataURL,
            {
              params: { s: prompt, tiling, strength: strength / 100 },
              headers: { "Access-Control-Allow-Origin": "*" },
              responseType: "arraybuffer",
            }
          );

          const bytes = response.data;
          const arrayBufferView = new Uint8Array(bytes);
          const blob = new Blob([arrayBufferView], { type: "image/png" });
          const urlCreator = window.URL || window.webkitURL;
          const imageUrl = urlCreator.createObjectURL(blob);

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(
              img,
              0,
              0,
              img.width,
              img.height,
              0,
              0,
              canvas.width,
              canvas.height
            );
            undo = [];
            undo.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            setGenerating(false);
          };
          img.src = imageUrl;
        }
      );
    } catch (e) {
      console.log(e);
      setGenerating(false);
    }
  };

  const unDo = () => {
    snapshot = undo.pop();
    redo.push(snapshot);
    if (undo.length > 0) ctx.putImageData([...undo].pop(), 0, 0);
    else clearCanvas();
    setRedoEnable(true);
    setUndoEnable(undo.length !== 0);
  };

  const reDo = () => {
    snapshot = redo.pop();
    console.log("redo", snapshot);
    undo.push(snapshot);
    ctx.putImageData(snapshot, 0, 0);
    setRedoEnable(redo.length !== 0);
  };

  const restoreDraw = () => {
    ctx.putImageData([...undo].pop(), 0, 0);
  };

  const setMaskPressed = () => {
    setMaskOn(!maskOn);
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    console.log(maskOn);
    if (maskOn) {
      let _mi = maskImage;
      setNormalImage(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (!maskImage) {
        _mi = ctx.createImageData(canvas.width, canvas.height);
        setMaskImage(_mi);
      }
      console.log("setting mask");
      ctx.putImageData(_mi, 0, 0);
    } else {
      let _ni = normalImage;
      setMaskImage(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (!_ni) {
        _ni = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < _ni.data.length; i += 4) {
          _ni.data[i + 3] = 0;
        }
        setNormalImage(_ni);
      }
      console.log("setting normal");
      ctx.putImageData(_ni, 0, 0);
    }
  };

  return (
    <div className="container">
      <section className="drawing-board">
        <canvas width={IMAGE_WIDTH} height={IMAGE_HEIGHT}></canvas>
      </section>
      <section className="tools-board">
        <div className="buttons draw-row">
          <button className="draw-button" onClick={unDo} disabled={!undoEnable}>
            undo
          </button>
          <button className="draw-button" onClick={reDo} disabled={!redoEnable}>
            redo
          </button>
          <button
            className="draw-button"
            onClick={clearCanvas}
            // disabled={!redoEnable}
          >
            clear
          </button>
          <button
            className="draw-button"
            onClick={restoreDraw}
            // disabled={!redoEnable}
          >
            restore
          </button>
          <button className="draw-button" id="mask" onClick={setMaskPressed}>
            {maskOn ? "mask" : "normal"}
          </button>
        </div>
        <div className="row buttons draw-row">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="prompt"
            placeholder="handpainted portrait of an owl, greg rutkowski"
          ></input>
          <button
            className="draw-button"
            onClick={generateImage}
            disabled={generating}
          >
            {generating ? "..." : "Draw"}
          </button>
        </div>
        <div className="row">
          <ul className="options">
            <input
              type="color"
              id="color-picker"
              value={swatch}
              onChange={(e) => {
                setColor(e.target.value);
              }}
            />
            <li className="option active tool" id="brush" key={0}>
              <img src="brush.svg" alt="brush" />
            </li>
            <li className="option tool" id="eraser" key={1}>
              <img src="eraser.svg" alt="eraser" />
            </li>
            {/*}
            <li className="option tool" id="rectangle" key={2}>
              Rectangle
            </li>
            <li className="option tool" id="circle" key={3}>
              Circle
            </li>
            <li className="option tool" id="triangle" key={4}>
              Triangle
            </li>
  */}
            <div className="size">
              <li className="option">
                <label htmlFor="size-slider">
                  <img src="size.svg" />
                </label>
                <input
                  type="range"
                  id="size-slider"
                  min="1"
                  max="100"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                  }}
                />
              </li>
            </div>
          </ul>
        </div>

        <div className="row">
          {/* checkbox for tiling */}
          <div className="checkbox">
            <input
              type="checkbox"
              id="tiling"
              checked={tiling}
              onChange={(e) => {
                setTiling(e.target.checked);
              }}
            />
            <label htmlFor="tiling">Tiling</label>
          </div>
          <div className="strength">
            {/* slider for strength */}
            <label htmlFor="strength-slider">
              <img src="blend.png" width="32px" height="32px" />
            </label>
            <input
              type="range"
              id="strength-slider"
              min="0"
              max="100"
              value={strength}
              onChange={(e) => {
                setStrength(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="row buttons">
          <button
            className="button"
            onClick={clearCanvas}
            disabled={generating}
          >
            <img src="clear.svg" alt="clear" />
          </button>
          <button className="button" onClick={saveImage} disabled={generating}>
            <img src="download.svg" alt="clear" />
          </button>
          <button
            className="button"
            onClick={uploadImage}
            disabled={generating}
          >
            <img src="upload.svg" alt="clear" />
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
