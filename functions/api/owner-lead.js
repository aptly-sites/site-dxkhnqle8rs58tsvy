import { handleLeadPost } from '../_lib/lead-post.js';
import ownerLeads from '../_lib/owner-leads.js';

export const onRequestPost = context => handleLeadPost(context, ownerLeads);
