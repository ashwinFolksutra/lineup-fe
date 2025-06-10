import { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { projectService } from "../services/projectService";
import { handleApiError } from "../services/api";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "../components/dialog";
import { Divider } from "../components/divider";
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownMenu,
} from "../components/dropdown";
import { Field, Label } from "../components/fieldset";
import { Heading } from "../components/heading";
import { Input, InputGroup } from "../components/input";
import { Textarea } from "../components/textarea";
import { Link } from "../components/link";
import { Select } from "../components/select";
import {
    EllipsisVerticalIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/16/solid";

import {
    ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        context: "",
        promptSettings: ""
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");

    // Load projects on component mount
    useEffect(() => {
        let isMounted = true;
        
        const fetchProjects = async () => {
            if (!isMounted) return;
            
            try {
                setLoading(true);
                const projects = await projectService.getAllProjects();
                console.log('Fetched projects:', projects); // Debug log
                if (isMounted) {
                    setProjects(projects);
                }
            } catch (error) {
                if (isMounted) {
                    const message = handleApiError(error);
                    console.error("Failed to load projects:", message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchProjects();
        
        return () => {
            isMounted = false;
        };
    }, []);



    const createProject = async () => {
        if (!formData.name.trim()) return;

        try {
            setCreating(true);
            const project = await projectService.createProject({
                name: formData.name,
                context: formData.context,
                global_prompt: formData.promptSettings,
            });

            setProjects((prev) => [project, ...prev]);
            setFormData({
                name: "",
                context: "",
                promptSettings: ""
            });
            setShowCreateModal(false);
        } catch (error) {
            const message = handleApiError(error);
            console.error("Failed to create project:", message);
        } finally {
            setCreating(false);
        }
    };

    const deleteProject = async (projectId, projectName) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await projectService.deleteProject(projectId);
            setProjects((prev) => prev.filter((p) => p.id !== projectId));
        } catch (error) {
            const message = handleApiError(error);
            console.error("Failed to delete project:", message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Filter and sort projects
    const filteredAndSortedProjects = projects
        .filter(
            (project) =>
                project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (project.description &&
                    project.description
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "date":
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case "modified":
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                default:
                    return 0;
            }
        });

    console.log('Projects state:', projects); // Debug log
    console.log('Filtered and sorted projects:', filteredAndSortedProjects); // Debug log

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p>Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            {projects.length > 0 && (
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="max-sm:w-full sm:flex-1">
                        <Heading>Projects</Heading>
                        {/* <div className="mt-4 flex max-w-xl gap-4">
                            <div className="flex-1">
                                <InputGroup>
                                    <MagnifyingGlassIcon />
                                    <Input
                                        name="search"
                                        placeholder="Search projects&hellip;"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </InputGroup>
                            </div>
                            <div>
                                <Select
                                    name="sort_by"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="name">Sort by name</option>
                                    <option value="date">Sort by date</option>
                                    <option value="modified">
                                        Sort by modified
                                    </option>
                                </Select>
                            </div>
                        </div> */}
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        Create project
                    </Button>
                </div>  
            )}

            {/* Content */}
            {filteredAndSortedProjects.length === 0 ? (
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="relative block w-full max-w-lg rounded-lg border-2 border-dashed border-white/10 p-12 text-center hover:border-white/20 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-hidden dark:focus:ring-offset-zinc-900"
                    >
                        <ArchiveBoxIcon className="mx-auto size-12 text-white/40" />

                        <span className="mt-8 block text-sm font-medium text-white/60">
                            {projects.length === 0
                                ? "Create your first project"
                                : "No projects match your search"}
                        </span>
                    </button>
                </div>
            ) : (
                <ul className="mt-10">
                    {filteredAndSortedProjects.map((project, index) => (
                        <li key={project.id}>
                            <Divider soft={index > 0} />
                            <div className="flex items-center justify-between">
                                <div className="flex gap-6 py-6">
                                    <div className="w-32 shrink-0">
                                        <Link
                                            href={`/editor/${project._id}`}
                                            aria-hidden="true"
                                        >
                                            <div className="aspect-3/2 rounded-lg shadow-sm bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                                <svg
                                                    className="w-8 h-8 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-base/6 text-white font-semibold">
                                            <Link
                                                href={`/editor/${project._id}`}
                                            >
                                                {project.name}
                                            </Link>
                                        </div>
                                        <div className="text-xs/6 text-zinc-500">
                                            {project.context}
                                        </div>
                                        <div className="text-xs/6 text-zinc-600">
                                            Created{" "}
                                            {formatDate(project.createdAt)}
                                            {project.updatedAt !==
                                                project.createdAt && (
                                                <span>
                                                    {" "}
                                                    <span aria-hidden="true">
                                                        ·
                                                    </span>{" "}
                                                    Modified{" "}
                                                    {formatDate(
                                                        project.updatedAt
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge
                                        className="max-sm:hidden"
                                        color="lime"
                                    >
                                        Active
                                    </Badge>
                                    <Dropdown>
                                        <DropdownButton
                                            plain
                                            aria-label="More options"
                                        >
                                            <EllipsisVerticalIcon />
                                        </DropdownButton>
                                        <DropdownMenu anchor="bottom end">
                                            <DropdownItem>
                                                <RouterLink
                                                    to={`/editor/${project.id}`}
                                                >
                                                    Open
                                                </RouterLink>
                                            </DropdownItem>
                                            <DropdownItem>Edit</DropdownItem>
                                            <DropdownItem>Export</DropdownItem>
                                            <DropdownItem
                                                onClick={() =>
                                                    deleteProject(
                                                        project.id,
                                                        project.name
                                                    )
                                                }
                                            >
                                                Delete
                                            </DropdownItem>
                                        </DropdownMenu>
                                    </Dropdown>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Create Project Dialog */}
            <Dialog open={showCreateModal} onClose={setShowCreateModal}>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                    Start building your next video project with a new lineup.
                </DialogDescription>
                <DialogBody>
                    <div className="space-y-6">
                        <Field>
                            <Label>Project Name</Label>
                            <Input
                                name="projectName"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                placeholder="Enter project name..."
                                onKeyPress={(e) =>
                                    e.key === "Enter" && createProject()
                                }
                            />
                        </Field>
                        <Field>
                            <Label>Context</Label>
                            <Textarea
                                name="context"
                                value={formData.context}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    context: e.target.value
                                }))}
                                placeholder="A short brief about the project..."
                                rows={3}
                            />
                        </Field>
                        <Field>
                            <Label>Prompt Settings</Label>
                            <Textarea
                                name="promptSettings"
                                value={formData.promptSettings}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    promptSettings: e.target.value
                                }))}
                                placeholder="Global prompt to be sent to the LLM model..."
                                rows={4}
                            />
                        </Field>
                    </div>
                </DialogBody>
                <DialogActions>
                    <Button
                        plain
                        onClick={() => {
                            setShowCreateModal(false);
                            setFormData({
                                name: "",
                                context: "",
                                promptSettings: ""
                            });
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={createProject}
                        disabled={!formData.name.trim() || creating}
                    >
                        {creating ? "Creating..." : "Create Project"}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ProjectsPage;
