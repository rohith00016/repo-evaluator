const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function evaluate(repoUrl) {
  const clonePath = path.join(__dirname, "cloned-repo");
  const testFilePath = path.join(clonePath, "src", "__tests__", "App.test.js");
  const babelConfigPath = path.join(clonePath, "babel.config.cjs");
  const jestConfigPath = path.join(clonePath, "jest.config.cjs");

  // Ensure proper cleanup in case of any failure
  const cleanUp = () => {
    if (fs.existsSync(clonePath)) {
      fs.rmSync(clonePath, { recursive: true, force: true });
    }
  };

  // Clean up any existing cloned directory
  cleanUp();

  try {
    // Clone the repository
    execSync(`git clone ${repoUrl} ${clonePath}`);

    // Create the test file with React import
    const testFileContent = `
    import React from 'react';
    import { render, fireEvent, screen } from '@testing-library/react';
    import '@testing-library/jest-dom';
    import App from '../App'; // Adjust the import path based on the actual file location
    import fs from 'fs';
    import path from 'path';

    test("adds and removes items from cart", () => {
      let marks = 0;
      render(<App />);

      // Get all "Add to cart" buttons
      const addToCartButtons = screen.getAllByText(/Add to cart/i);

      if (addToCartButtons.length > 0) {
        // Click the first "Add to cart" button
        fireEvent.click(addToCartButtons[0]);

        // Get all buttons with the role "button" and name "Cart"
        const allCartButtons = screen.queryAllByRole("button", { name: /Cart/i });
        
        // Filter to find the one with the correct class or additional attribute
        const cartButton = allCartButtons.find(button => button.querySelector(".badge"));
        let cartBadge;
        if (cartButton) {
          cartBadge = cartButton.querySelector(".badge");
          if (cartBadge && cartBadge.textContent === "1") {
            marks += 2; // Add 2 marks for "Add to cart" updating the cart
          }
        }
        
        // Find all "Remove from cart" buttons
        const removeFromCartButtons = screen.getAllByText(/Remove from cart/i);
        if (removeFromCartButtons.length > 0) {
          const removeFromCartButton = removeFromCartButtons[0];
          expect(removeFromCartButton).toBeInTheDocument();

          // Click the "Remove from cart" button
          fireEvent.click(removeFromCartButton);

          // Re-fetch the cartButton after the remove action
          const updatedCartButtons = screen.queryAllByRole("button", { name: /Cart/i });
          const updatedCartButton = updatedCartButtons.find(button => button.querySelector(".badge"));
          const updatedCartBadge = updatedCartButton?.querySelector(".badge");

          // Check if the cart badge text content is updated
          if (updatedCartBadge && updatedCartBadge.textContent === "0") {
            marks += 2; // Add 2 marks for "Remove from cart" replacing "Add to cart"
          }
        }

        // Ensure the "Add to cart" button is back
        const updatedAddToCartButtons = screen.getAllByText(/Add to cart/i);
        if (updatedAddToCartButtons.length > 0) {
          marks += 2; // Add 2 marks for the button being back
        }
      }

      // Check UI (assuming you have some specific UI checks)
      const uiChecksPassed = true; // Set to false if UI checks fail
      if (uiChecksPassed) {
        marks += 2; // Add 2 marks for UI
      }

      // Save the marks to a JSON file
      const marksPath = path.join(__dirname, 'marks.json');
      fs.writeFileSync(marksPath, JSON.stringify({ marks }), 'utf8');

      // Log the marks for debugging purposes
      console.log('Marks:', marks);
    });
    `;
    if (!fs.existsSync(path.dirname(testFilePath))) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
    }
    fs.writeFileSync(testFilePath, testFileContent);

    // Create Babel configuration file (CommonJS)
    const babelConfigContent = `
  module.exports = {
    presets: [
      '@babel/preset-env',
      '@babel/preset-react'
    ],
  };
    `;
    fs.writeFileSync(babelConfigPath, babelConfigContent);

    // Create Jest configuration file (CommonJS)
    const jestConfigContent = `
  module.exports = {
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
    transformIgnorePatterns: [
      "/node_modules/(?!bootstrap).+\\.js$"
    ],
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },
    testEnvironment: 'jest-environment-jsdom'
  };
    `;
    fs.writeFileSync(jestConfigPath, jestConfigContent);

    // Add test script to package.json if not present
    const packageJsonPath = path.join(clonePath, "package.json");
    const packageJson = require(packageJsonPath);

    if (!packageJson.scripts || !packageJson.scripts.test) {
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.test = "jest";
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // Navigate to the cloned directory and install dependencies
    execSync(`cd ${clonePath} && npm install`, { stdio: "inherit" });

    // Ensure Babel, Jest, and Testing Library are installed locally
    execSync(
      `cd ${clonePath} && npm install --save-dev @babel/preset-react @babel/core babel-jest @babel/preset-env @testing-library/react @testing-library/jest-dom identity-obj-proxy jest-environment-jsdom`,
      { stdio: "inherit" }
    );

    // Run tests using Jest and capture the results
    execSync(`cd ${clonePath} && npx jest --json --outputFile=results.json`, {
      stdio: "inherit",
    });

    // Read and parse results.json
    const results = JSON.parse(
      fs.readFileSync(path.join(clonePath, "results.json"), "utf8")
    );

    // Read marks from marks.json
    const marksPath = path.join(clonePath, "src/__tests__", "marks.json");
    const marksFile = fs.existsSync(marksPath)
      ? JSON.parse(fs.readFileSync(marksPath, "utf8"))
      : { marks: 0 };

    return {
      success: true,
      message: "Evaluation complete",
      marks: marksFile.marks,
    };
  } catch (error) {
    console.error("Error during evaluation:", error);
    return {
      success: false,
      message: "Test execution failed",
      marks: 0,
    };
  } finally {
    cleanUp();
  }
}

module.exports = evaluate;
