import axios from "axios";
import React, { useEffect, useState } from "react";
import "./App.css";
import { IMAGE_HEIGHT, IMAGE_WIDTH, STABLE_DIFFUSION_URL } from "./constants";

function App() {
  const [generating, setGenerating] = useState(false);
  const [size, setSize] = useState(5);
  const [color, setColor] = useState("#4a9f7");

  useEffect(() => {
    const canvas = document.querySelector("canvas"),
      toolBtns = document.querySelectorAll(".tool"),
      sizeSlider = document.querySelector("#size-slider"),
      colorBtns = document.querySelectorAll(".colors .option"),
      colorPicker = document.querySelectorAll("#color-picker")[0],
      ctx = canvas.getContext("2d");

    // global variables with default values
    let prevMouseX,
      prevMouseY,
      snapshot,
      isDrawing = false,
      selectedTool = "brush",
      brushWidth = 5,
      selectedColor = "#000";

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // if the window size changes, resize the canvas
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    const drawRect = (e) => {
      ctx.fillRect(
        e.offsetX,
        e.offsetY,
        prevMouseX - e.offsetX,
        prevMouseY - e.offsetY
      );
    };

    const drawCircle = (e) => {
      ctx.beginPath(); //creating a new path to draw circle
      // getting radius for circle according to the mouse pointer
      let radius = Math.sqrt(
        Math.pow(prevMouseX - e.offsetX, 2) +
          Math.pow(prevMouseY - e.offsetY, 2)
      );
      ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI); //creating circle according to the mouse pointer
      ctx.stroke();
      ctx.fill(); //if fillColor is checked fill circle else draw border circle
    };

    const drawTriangle = (e) => {
      ctx.beginPath(); //creating new path to draw circle
      ctx.moveTo(prevMouseX, prevMouseY); // moving triangle to the mouse pointer
      ctx.lineTo(e.offsetX, e.offsetY); // creating first line according to the mouse pointer
      ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY); // creating bottom line of the triangle
      ctx.closePath(); // closing path of the triangle so the third line draw automatically
      ctx.stroke();
      ctx.fill(); //if fillColor is checked fill circle else draw border triangle
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      prevMouseX = e.offsetX; //passing current MouseX position as prevMouseX value
      prevMouseY = e.offsetY; //passing current MouseY position as prevMouseY value
      ctx.beginPath(); //creating new path to draw
      ctx.lineWidth = brushWidth; //passing brushSize as line width
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); //coping canvas data and passing as snapshot value.. this avoids dragging the image
      ctx.strokeStyle = selectedColor; // passing selectedColor as stroke syle
      ctx.fillStyle = selectedColor; // passing selectedColor as fill style
    };

    const drawing = (e) => {
      if (!isDrawing) return; //if isDrawing is flase return form here
      ctx.putImageData(snapshot, 0, 0); //adding the copied canvas on to this canvas

      if (selectedTool === "brush" || selectedTool === "eraser") {
        ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor; //if selected tool is eraser then set strokeStyle to white to paint white color onto the existing canvas content else set the stroke color to selected color
        ctx.lineTo(e.offsetX, e.offsetY); //creating line according to the mouse pointer
        ctx.stroke(); //drawin/filling line with color
      } else if (selectedTool === "rectangle") {
        drawRect(e);
      } else if (selectedTool === "circle") {
        drawCircle(e);
      } else {
        drawTriangle(e);
      }
    };

    toolBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        //adding click event to all tool option
        // removing active class from the pervious option and adding on current clicked option
        document.querySelector(".options .active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
        console.log(btn.id);
      });
    });

    sizeSlider.addEventListener(
      "change",
      () => (brushWidth = sizeSlider.value)
    ); //passin slider value as brush Size

    colorBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // adding click event to all color button
        // removing active class from the previous option and adding on current clicked option
        document
          .querySelector(".options .selected")
          .classList.remove("selected");
        btn.classList.add("selected");
        // passing selected btn background as selectedColor value
        selectedColor = window
          .getComputedStyle(btn)
          .getPropertyValue("background-color");
      });
    });

    colorPicker;
    colorPicker.addEventListener("change", () => {
      colorPicker.parentElement.style.background = colorPicker.value;
      colorPicker.parentElement.click();
    });

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", drawing);
    canvas.addEventListener("mouseup", () => (isDrawing = false));
  }, []);

  const clearCanvas = () => {
    if (generating) {
      return;
    }

    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      canvas.getContext("2d").drawImage(sourceImage, 0, 0, width, height);
      callback(canvas.toDataURL());
    };

    sourceImage.src = url;
  };

  const saveImage = () => {
    if (generating) {
      return;
    }

    const canvas = document.querySelector("canvas");
    resizeImage(
      canvas.toDataURL(),
      IMAGE_WIDTH,
      IMAGE_HEIGHT,
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
          if (img.width !== IMAGE_WIDTH && img.height !== IMAGE_HEIGHT) {
            alert(
              "Invalid image size, must be " + IMAGE_WIDTH + "X" + IMAGE_HEIGHT
            );
            return;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
  };

  const generateImage = async () => {
    if (generating) {
      return;
    }

    setGenerating(true);
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const data = new FormData();
    data.append("init_image", canvas.toDataURL());
    const response = await axios.post(
      "http://localhost:8080/" + STABLE_DIFFUSION_URL,
      { init_image: canvas.toDataURL() },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
        responseType: "arraybuffer",
      }
    );

    const bytes = response.data;
    const arrayBufferView = new Uint8Array(bytes);
    const blob = new Blob([arrayBufferView], { type: "image/png" });
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);

    const img = new Image(IMAGE_WIDTH, IMAGE_HEIGHT);
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setGenerating(false);
    };
    img.src = imageUrl;
  };

  return (
    <div className="container">
      <section className="tools-board">
        <div className="row">
          <ul className="options">
            <li className="option active tool" id="brush" key={0}>
              Brush
            </li>
            <li className="option tool" id="eraser" key={1}>
              Eraser
            </li>
            <li className="option tool" id="rectangle" key={2}>
              Rectangle
            </li>
            <li className="option tool" id="circle" key={3}>
              Circle
            </li>
            <li className="option tool" id="triangle" key={4}>
              Triangle
            </li>
            <li className="option">
              <input
                type="range"
                id="size-slider"
                min="1"
                max="30"
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                }}
              />
            </li>
          </ul>
        </div>
        <div className="row colors">
          <ul className="options">
            <li className="option" key={0}></li>
            <li className="option selected" key={1}></li>
            <li className="option" key={2}></li>
            <li className="option" key={3}></li>
            <li className="option" key={4}>
              <input
                type="color"
                id="color-picker"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                }}
              />
            </li>
          </ul>
        </div>

        <div className="row buttons">
          <button
            className="clear-canvas"
            onClick={clearCanvas}
            disabled={generating}
          >
            Clear Canvas
          </button>
          <button
            className="save-img"
            onClick={saveImage}
            disabled={generating}
          >
            Save Image
          </button>
          <button
            className="save-img"
            onClick={uploadImage}
            disabled={generating}
          >
            Upload Image
          </button>
          <button
            className="clear-canvas"
            onClick={generateImage}
            disabled={generating}
          >
            {generating ? "Generating Image" : "Generate Image"}
          </button>
        </div>
      </section>
      <section className="drawing-board">
        <canvas width={IMAGE_WIDTH} height={IMAGE_HEIGHT}></canvas>
      </section>
    </div>
  );
}

export default App;
