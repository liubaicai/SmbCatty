import { Host,Snippet } from '../../domain/models';

export const INITIAL_HOSTS: Host[] = [
  { id: '1', label: 'Production Server', hostname: '10.0.0.12', port: 445, share: 'shared', username: 'admin', group: 'Production', tags: ['prod'] },
  { id: '2', label: 'File Server', hostname: 'fileserver.local', port: 445, share: 'documents', username: 'user', group: 'Office', tags: ['files'] },
];

export const INITIAL_SNIPPETS: Snippet[] = [];
