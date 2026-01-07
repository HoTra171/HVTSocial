        // Handle TOP clause in subqueries: SELECT TOP (n) ... ORDER BY -> SELECT ... ORDER BY LIMIT n
        pgQuery = pgQuery.replace(/SELECT\s+TOP\s*\((\d+)\)([^]*?)(ORDER BY[^)]+)/gi, (match, limit, middle, orderBy) => {
          return `SELECT${middle}${orderBy} LIMIT ${limit}`;
        });
        
        // Handle main query TOP clause
        const mainTopMatch = sqlQuery.match(/^SELECT\s+TOP\s*\((\d+)\)/i);
        if (mainTopMatch && pgQuery.includes('SELECT TOP')) {
          pgQuery = pgQuery.replace(/^SELECT\s+TOP\s*\(\d+\)/i, 'SELECT');
          if (!pgQuery.includes('LIMIT')) {
            pgQuery += ` LIMIT ${mainTopMatch[1]}`;
          }
        }
