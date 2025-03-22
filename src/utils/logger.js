export const logger = {
  log: (message, data = null) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [INFO] ${message}`);
      if (typeof data === "object") {
        try {
          console.log(JSON.stringify(data, null, 2));
        } catch (e) {
          console.log(data);
        }
      } else {
        console.log(data);
      }
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`);
    }
  },

  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`Stack trace: ${error.stack}`);
      } else if (typeof error === "object") {
        try {
          console.error(JSON.stringify(error, null, 2));
        } catch (e) {
          console.error(error);
        }
      } else {
        console.error(error);
      }
    }
  },

  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`);
    if (data) {
      if (typeof data === "object") {
        try {
          console.warn(JSON.stringify(data, null, 2));
        } catch (e) {
          console.warn(data);
        }
      } else {
        console.warn(data);
      }
    }
  },

  debug: (message, data = null) => {
    if (process.env.DEBUG_MODE === "true") {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] ${message}`);
      if (data) {
        if (typeof data === "object") {
          try {
            console.log(JSON.stringify(data, null, 2));
          } catch (e) {
            console.log(data);
          }
        } else {
          console.log(data);
        }
      }
    }
  },
};
