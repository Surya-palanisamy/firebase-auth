"use client"
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import { Building2, MessageSquare, Phone, RefreshCw, Search } from "lucide-react"
import { useState } from "react"
import LoadingSpinner from "../components/LoadingSpinner"
import { useAppContext } from "../context/AppContext"

export default function Shelters() {
  const { shelters, coordinators, resources, refreshData, isLoading } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const theme = useTheme()

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const filteredShelters = shelters.filter(
    (shelter) =>
      shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalCapacity = shelters.reduce((total, shelter) => {
    const [current, max] = shelter.capacity.split("/").map(Number)
    return total + (max || 0)
  }, 0)

  const currentOccupancy = shelters.reduce((total, shelter) => {
    const [current] = shelter.capacity.split("/").map(Number)
    return total + (current || 0)
  }, 0)

  const availableSpaces = totalCapacity - currentOccupancy

  const shelterStats = [
    { title: "Total Active Shelters", value: shelters.length.toString(), icon: <Building2 size={24} /> },
    { title: "Total Capacity", value: totalCapacity.toLocaleString(), icon: <Building2 size={24} /> },
    { title: "Current Occupancy", value: currentOccupancy.toLocaleString(), icon: <Building2 size={24} /> },
    { title: "Available Spaces", value: availableSpaces.toLocaleString(), icon: <Building2 size={24} /> },
  ]

  if (isLoading) {
    return <LoadingSpinner/>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "success"
      case "Near Full":
        return "warning"
      case "Full":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Relief Connect
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            size="medium"
          >
            <RefreshCw
              size={20}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </IconButton>
        </Stack>
      </Box>

      {/* Stats Grid */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {shelterStats.map((stat, index) => (
          <Card key={index} sx={{ flex: 1 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 1 }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "50%",
                    bgcolor: theme.palette.primary.main + "20",
                    display: "flex",
                    color: theme.palette.primary.main,
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Active Shelters */}
      <Card sx={{ mb: 3 }}>
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Active Shelters
          </Typography>
          <TextField
            placeholder="Search shelters..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", md: 300 } }}
          />
        </Box>

        <TableContainer sx={{ maxHeight: 440, bgcolor: "transparent" }}>
          <Table stickyHeader size="medium" aria-label="shelters table">
            <TableHead>
              <TableRow
              >
                <TableCell>Shelter Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Resources</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredShelters.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{ py: 4, textAlign: "center", color: "text.secondary" }}
                  >
                    No shelters found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredShelters.map((shelter, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ fontWeight: 500, color: "text.primary" }}>
                      {shelter.name}
                    </TableCell>
                    <TableCell sx={{ color: "text.primary" }}>
                      {shelter.location}
                    </TableCell>
                    <TableCell sx={{ color: "text.primary" }}>
                      {shelter.capacity}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shelter.status}
                        color={getStatusColor(shelter.status)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shelter.resources}
                        color={
                          shelter.resources === "Adequate"
                            ? "success"
                            : shelter.resources === "Low"
                            ? "warning"
                            : "error"
                        }
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: "text.primary" }}>
                      {shelter.contact}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" color="primary">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Resource Management */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Resource Management
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {resources.map((resource, index) => (
            <Card key={index} sx={{ flex: 1 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  {resource.icon}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {resource.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {resource.percentage}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={resource.percentage}
                  sx={{
                    mb: 2,
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[700]
                        : theme.palette.grey[200],
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        resource.percentage > 70
                          ? theme.palette.success.main
                          : resource.percentage > 40
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                    },
                  }}
                />
                <Button variant="outlined" fullWidth size="small">
                  Assign More
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Shelter Coordinators */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Shelter Coordinators
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {coordinators.map((coordinator, index) => (
            <Card key={index} sx={{ flex: 1 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <img
                    src={coordinator.avatar || "/placeholder.svg"}
                    alt={coordinator.name}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {coordinator.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {coordinator.role}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
                  {coordinator.shelter}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    startIcon={<Phone size={16} />}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 ,color:"red"}}

                  >
                    Call
                  </Button>
                  <Button
                    startIcon={<MessageSquare size={16} />}
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1 }}
                  >
                    Message
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
