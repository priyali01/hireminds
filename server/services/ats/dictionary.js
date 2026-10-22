/**
 * Canonical skills and the aliases that count as the same skill.
 * Longer aliases are listed first so "node.js" is tried before "node".
 * Matching is whole-token. "C" does not match "communication", and "Java" does not match "JavaScript".
 */

const SKILL_DICTIONARY = [
  { canonical: 'javascript', aliases: ['javascript', 'js'] },
  { canonical: 'typescript', aliases: ['typescript', 'ts'] },
  { canonical: 'python', aliases: ['python'] },
  { canonical: 'java', aliases: ['java'] },
  { canonical: 'c++', aliases: ['c++', 'cpp'] },
  { canonical: 'c#', aliases: ['c#', 'c sharp', 'csharp'] },
  { canonical: 'c', aliases: ['c'] },
  { canonical: 'golang', aliases: ['golang', 'go lang'] },
  { canonical: 'sql', aliases: ['sql'] },
  { canonical: 'mysql', aliases: ['mysql'] },
  { canonical: 'postgresql', aliases: ['postgresql', 'postgres'] },
  { canonical: 'mongodb', aliases: ['mongodb', 'mongo'] },
  { canonical: 'redis', aliases: ['redis'] },
  { canonical: 'react', aliases: ['react.js', 'reactjs', 'react'] },
  { canonical: 'next.js', aliases: ['next.js', 'nextjs'] },
  { canonical: 'node.js', aliases: ['node.js', 'nodejs', 'node'] },
  { canonical: 'express', aliases: ['express.js', 'expressjs', 'express'] },
  { canonical: 'html', aliases: ['html5', 'html'] },
  { canonical: 'css', aliases: ['css3', 'css'] },
  { canonical: 'tailwind', aliases: ['tailwind css', 'tailwind'] },
  { canonical: 'git', aliases: ['git'] },
  { canonical: 'docker', aliases: ['docker'] },
  { canonical: 'kubernetes', aliases: ['kubernetes', 'k8s'] },
  { canonical: 'aws', aliases: ['amazon web services', 'aws'] },
  { canonical: 'azure', aliases: ['azure'] },
  { canonical: 'gcp', aliases: ['google cloud', 'gcp'] },
  { canonical: 'linux', aliases: ['linux'] },
  { canonical: 'rest api', aliases: ['restful api', 'rest api', 'restful'] },
  { canonical: 'graphql', aliases: ['graphql'] },
  { canonical: 'dsa', aliases: ['data structures and algorithms', 'data structures', 'algorithms', 'dsa'] },
  { canonical: 'dbms', aliases: ['database management', 'dbms'] },
  { canonical: 'operating systems', aliases: ['operating systems'] },
  { canonical: 'machine learning', aliases: ['machine learning'] },
  { canonical: 'pandas', aliases: ['pandas'] },
  { canonical: 'numpy', aliases: ['numpy'] },
  { canonical: 'tensorflow', aliases: ['tensorflow'] },
  { canonical: 'pytorch', aliases: ['pytorch'] },
  { canonical: 'django', aliases: ['django'] },
  { canonical: 'flask', aliases: ['flask'] },
  { canonical: 'spring boot', aliases: ['spring boot', 'springboot'] },
  { canonical: 'selenium', aliases: ['selenium'] },
  { canonical: 'jest', aliases: ['jest'] },
  { canonical: 'postman', aliases: ['postman'] },
  { canonical: 'jenkins', aliases: ['jenkins'] },
  { canonical: 'ci/cd', aliases: ['ci/cd', 'cicd'] },
  { canonical: 'figma', aliases: ['figma'] },
  { canonical: 'photoshop', aliases: ['adobe photoshop', 'photoshop'] },
  { canonical: 'illustrator', aliases: ['adobe illustrator', 'illustrator'] },
  { canonical: 'ux research', aliases: ['user experience research', 'ux research', 'user research'] },
  { canonical: 'usability testing', aliases: ['usability testing', 'usability test'] },
  { canonical: 'interaction design', aliases: ['interaction design'] },
  { canonical: 'design systems', aliases: ['design systems', 'design system'] },
  { canonical: 'ui/ux', aliases: ['ui/ux', 'ux/ui', 'ui / ux', 'ux / ui', 'ui ux', 'ux ui'] },
  { canonical: 'excel', aliases: ['microsoft excel', 'excel'] },
  { canonical: 'power bi', aliases: ['power bi'] },
  { canonical: 'tableau', aliases: ['tableau'] },
]

/**
 * Soft skills are matched as phrases and scored only in the soft-skill category.
 * They are not technical requirements, so a hit here is not also a required-skill hit.
 */
const SOFT_SKILLS = [
  { canonical: 'communication', aliases: ['communication'] },
  { canonical: 'teamwork', aliases: ['teamwork', 'team work'] },
  { canonical: 'leadership', aliases: ['leadership'] },
  { canonical: 'problem solving', aliases: ['problem solving', 'problem-solving'] },
  { canonical: 'collaboration', aliases: ['collaboration'] },
  { canonical: 'time management', aliases: ['time management'] },
  { canonical: 'mentoring', aliases: ['mentoring', 'mentorship'] },
]

module.exports = { SKILL_DICTIONARY, SOFT_SKILLS }
