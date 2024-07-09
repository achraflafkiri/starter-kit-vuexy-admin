"use client";

import React, { useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete, Phone, Stop, ViewModule, TableRows } from '@mui/icons-material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AgentDialog from '@/components/agent/AgentDialog';
import { getAssistants, createAssistant, updateAssistant, deleteAssistant } from '@/app/api/functions/agents';
import { Agent } from '@/types/Agent';

const AgentsList: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [open, setOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [view, setView] = useState<'table' | 'card'>('table');
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null);
  const [callInProgress, setCallInProgress] = useState(false); // Track if a call is in progress

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const assistantsRes = await getAssistants();
        setAgents(assistantsRes.data);
        console.log("agents list => ", assistantsRes.data);

      } catch (error) {
        console.error(error);
      }
    };

    fetchAgents();
  }, []);

  const handleClickOpen = (agent: Agent) => {
    setEditingAgent(agent);
    setOpen(true);
  };

  const handleAddAgentClick = () => {
    setEditingAgent({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (agent: Agent) => {

    console.log("agent => ", agent);

    try {
      const agentData = {
        "transcriber": {
          "provider": "deepgram",
          "model": "nova-2",
          "language": agent.language === undefined ? "en" : agent.language,
          "smartFormat": true,
        },
        "model": {
          "messages": [
            {
              "content": agent.prompt, // Prompt message
              "role": agent.promptRole === undefined ? "system" : agent.promptRole // "model.messages.0.role must be one of the following values: assistant, function, user, system, tool"
            }
          ],
          "functions": agent.functionsList, // Functions List
          "provider": "anyscale",
          "model": "",
          "temperature": 1,
          "maxTokens": 525,
          "emotionRecognitionEnabled": true
        },
        "voice": {
          "inputPreprocessingEnabled": true,
          "inputReformattingEnabled": true,
          "inputMinCharacters": 30,
          "inputPunctuationBoundaries": [
            "。", "，", ".", "!", "?", ";", ")", "،", "۔", "।", "॥", "|", "||", ",", ":"
          ],
          "fillerInjectionEnabled": true,
          "provider": "azure",
          "voiceId": "andrew",
          "speed": 1.25
        },
        "firstMessageMode": "assistant-speaks-first",
        "recordingEnabled": true,
        "hipaaEnabled": true,
        "clientMessages": [
          "conversation-update", "function-call", "hang", "model-output", "speech-update", "status-update", "transcript", "tool-calls", "user-interrupted", "voice-input"
        ],
        "serverMessages": [
          "conversation-update", "end-of-call-report", "function-call", "hang", "speech-update", "status-update", "tool-calls", "transfer-destination-request", "user-interrupted"
        ],
        "silenceTimeoutSeconds": 30,
        "responseDelaySeconds": 0.4,
        "llmRequestDelaySeconds": 0.1,
        "numWordsToInterruptAssistant": 5,
        "maxDurationSeconds": 1800,
        "backgroundSound": "office",
        "backchannelingEnabled": true,
        "backgroundDenoisingEnabled": true,
        "modelOutputInMessagesEnabled": true,
        "name": agent.name, // Assistant Name
        "firstMessage": agent.firstMessage, // First Message
        "voicemailMessage": agent.voicemailMessage, // Voic Email Message

        // "Voicemail Message" is a recorded audio left by a caller when the recipient is unavailable, which the recipient can access later.
        "endCallMessage": agent.endCallMessage, // end Call Message

        "serverUrl": "https://webhook.site/20988bdc-a6f7-41b8-af41-8978220de89c",
        "artifactPlan": {
          "videoRecordingEnabled": true
        }
      }

      console.log("agentData => ", agentData);

      if (agent.id) {
        const res = await updateAssistant(agent.id, agentData);
        if (res.status === 200) {
          setAgents(agents.map(a => a.id === agent.id ? res.data : a));
          toast.success('Agent updated successfully!');
        }
      } else {
        const response = await createAssistant(agentData);
        setAgents([...agents, response.data]);
        toast.success('Agent created successfully!');
      }
    } catch (error) {
      toast.error(agent.id ? 'Failed to update agent.' : 'Failed to create agent.');
      console.error(error);
    }

    handleClose();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAssistant(id);
      const updatedAgents = agents.filter(agent => agent.id !== id);
      setAgents(updatedAgents);
      toast.success('Agent deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete agent.');
      console.error(error);
    }
  };

  const handleViewToggle = () => {
    setView(view === 'table' ? 'card' : 'table');
  };

  const handleCall = async (agent: Agent) => {
    setLoadingAgentId(agent.id);
    try {
      const vapi = new Vapi('7abfc5b1-4695-492e-aecb-c0db750f9b80');

      vapi.on('message', (message) => {
        console.log('Received message:', message);
      });

      vapi.on('call-start', () => {
        console.log('Call has started');
        toast.success(`Started conversation with ${agent.name}!`);
        setCallInProgress(true); // Update call status
      });

      vapi.on('call-end', () => {
        console.log('Call has ended');
        setLoadingAgentId(null);
        setCallInProgress(false); // Update call status
      });

      console.log("agent.prompt => ", agent);

      const startCall = await vapi.start({
        name: "Paula-broadway",
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          systemPrompt: agent.model.messages[0].content,
          functions: [
            {
              name: "suggestShows",
              async: true,
              description: "Suggests a list of broadway shows to the user.",
              parameters: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description: "The location for which the user wants to see the shows.",
                  },
                  date: {
                    type: "string",
                    description: "The date for which the user wants to see the shows.",
                  },
                },
              },
            },
            {
              name: "confirmDetails",
              async: true,
              description: "Confirms the details provided by the user.",
              parameters: {
                type: "object",
                properties: {
                  show: {
                    type: "string",
                    description: "The show for which the user wants to book tickets.",
                  },
                  date: {
                    type: "string",
                    description: "The date for which the user wants to book the tickets.",
                  },
                  location: {
                    type: "string",
                    description: "The location for which the user wants to book the tickets.",
                  },
                  numberOfTickets: {
                    type: "number",
                    description: "The number of tickets that the user wants to book.",
                  },
                },
              },
            },
            {
              name: "bookTickets",
              async: true,
              description: "Books tickets for the user.",
              parameters: {
                type: "object",
                properties: {
                  show: {
                    type: "string",
                    description: "The show for which the user wants to book tickets.",
                  },
                  date: {
                    type: "string",
                    description: "The date for which the user wants to book the tickets.",
                  },
                  location: {
                    type: "string",
                    description: "The location for which the user wants to book the tickets.",
                  },
                  numberOfTickets: {
                    type: "number",
                    description: "The number of tickets that the user wants to book.",
                  },
                },
              },
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "paula",
        },
        firstMessage: agent.firstMessage,
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL
          ? process.env.NEXT_PUBLIC_SERVER_URL
          : "https://08ae-202-43-120-244.ngrok-free.app/api/webhook",
      });

      if (startCall) {
        setCallInProgress(true)
      }

    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation.');
      setLoadingAgentId(null);
    }
  };

  const handleStop = async (agent: Agent) => {
    try {
      const vapi = new Vapi('7abfc5b1-4695-492e-aecb-c0db750f9b80');
      await vapi.stop();
      setLoadingAgentId(null);
      toast.success(`Stopped conversation with ${agent.name}!`);
    } catch (error) {
      console.error('Error stopping conversation:', error);
      toast.error('Failed to stop conversation.');
    }
  };

  return (
    <Container>

      <Typography variant="h4" component="h1" gutterBottom>
        Agents
      </Typography>
      <Button variant="contained" color="primary" onClick={handleAddAgentClick}>
        Add Agent
      </Button>
      <Button variant="contained" color="secondary" onClick={handleViewToggle} style={{ marginLeft: '10px' }}>
        {view === 'table' ? <ViewModule /> : <TableRows />}
      </Button>

      {view === 'table' ? (
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Voice Provider</TableCell>
                <TableCell>Model Provider</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent?.voice?.provider}</TableCell>
                  <TableCell>{agent?.model?.provider}</TableCell>
                  <TableCell>{new Date(agent.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleClickOpen(agent)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(agent.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={loadingAgentId === agent.id ? <CircularProgress style={{ color: "#fff" }} size={20} /> : <Phone style={{ fontSize: '20px' }} />}
                      onClick={() => handleCall(agent)}
                      style={{ padding: '10px 30px', fontSize: '18px' }}
                      disabled={loadingAgentId === agent.id}
                    >
                      {loadingAgentId === agent.id ? 'Connecting Call...' : 'Talk'}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Stop />}
                      onClick={() => handleStop(agent)}
                      style={{ padding: '10px 30px', fontSize: '18px', marginLeft: '10px' }}
                      disabled={loadingAgentId !== agent.id || !callInProgress}
                    >
                      Stop
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={3} style={{ marginTop: "10px" }}>
          {agents.map((agent) => (
            <Grid item xs={6} key={agent.id} >
              <Card style={{ minWidth: '400px' }}>
                <CardContent>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: "30px" }}>
                    <Typography variant="h4" component="div" style={{ fontSize: '"25px"', fontWeight: 'bold' }}>
                      {agent.name}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={loadingAgentId === agent.id ? <CircularProgress style={{ color: "#fff" }} size={20} /> : <Phone style={{ fontSize: '20px' }} />}
                      onClick={() => handleCall(agent)}
                      style={{ padding: '10px 40px', fontSize: '20px' }}
                      disabled={loadingAgentId === agent.id}
                    >
                      {loadingAgentId === agent.id ? 'Connecting Call...' : 'Talk'}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Stop />}
                      onClick={() => handleStop(agent)}
                      style={{ padding: '10px 30px', fontSize: '18px', marginLeft: '10px' }}
                      disabled={loadingAgentId !== agent.id || !callInProgress}
                    >
                      Stop
                    </Button>
                  </div>
                  <Typography color="textSecondary" marginBottom={"20px"}>
                    Voice Provider: {agent.voice.provider}
                  </Typography>
                  <Typography color="textSecondary" marginBottom={"20px"}>
                    Model Provider: {agent.model.provider}
                  </Typography>
                  <Typography color="textSecondary" >
                    Created At: {new Date(agent.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => handleClickOpen(agent)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(agent.id)}>
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AgentDialog
        open={open}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        editingAgent={editingAgent}
      />
    </Container>
  );
};

export default AgentsList;
