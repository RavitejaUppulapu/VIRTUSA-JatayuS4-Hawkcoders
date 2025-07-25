import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Fab,
  Drawer,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import axios from "axios";

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "Hello! I'm your AI maintenance assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8000";
      const response = await axios.post(`${API_BASE_URL}/ai-chat`, {
        message: input,
      });

      let botContent = response.data.response;
      console.log(botContent);
      // Remove all asterisks from the response
      if (botContent) {
        botContent = botContent.replace(/\*/g, "");
      }
      // Check for Gemini error in the response and show a user-friendly message
      if (botContent && botContent.startsWith("Gemini AI error:")) {
        botContent =
          "Sorry, the AI assistant is currently unavailable. Please try again later or contact your administrator to check the Gemini API setup.";
      }

      const botMessage = {
        type: "bot",
        content: botContent,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        type: "bot",
        content: "I apologize, but I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
        }}
        onClick={() => setOpen(true)}
      >
        <ChatIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 400 } },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 0,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <BotIcon color="primary" />
              <Typography variant="h6">AI Maintenance Assistant</Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Paper>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              bgcolor: "grey.50",
            }}
          >
            <List>
              {messages.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection:
                      message.type === "user" ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    border: "none",
                    background: "none",
                    px: 0,
                    py: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 1,
                      maxWidth: "80%",
                    }}
                  >
                    {message.type === "bot" && (
                      <Avatar
                        sx={{ bgcolor: "primary.main", width: 36, height: 36 }}
                      >
                        <BotIcon />
                      </Avatar>
                    )}
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor:
                          message.type === "user"
                            ? "primary.main"
                            : "background.paper",
                        color:
                          message.type === "user" ? "white" : "text.primary",
                        borderRadius: 3,
                        fontSize: "1rem",
                        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
                        boxShadow: 2,
                        maxWidth: 500,
                        minWidth: 60,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.7,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "1rem",
                          fontFamily:
                            "'Segoe UI', 'Roboto', 'Arial', sans-serif",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.7,
                        }}
                      >
                        {message.content}
                      </Typography>
                    </Paper>
                    {message.type === "user" && (
                      <Avatar
                        sx={{
                          bgcolor: "grey.400",
                          color: "black",
                          width: 36,
                          height: 36,
                        }}
                      >
                        <ChatIcon />
                      </Avatar>
                    )}
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
            {loading && (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>

          {/* Input */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 0,
            }}
          >
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                size="small"
                data-testid="ai-chat-input"
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Drawer>
    </>
  );
};

export default AIChat;
