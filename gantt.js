$.ganttdata = {
    tmp:{}
}
$.gantt = function(){
    var outline = {
        projects:{},
        resources:[],
        timeslots:[],
        assignments:{}
    }
    
    //What are the gantts on this page? (so that we can have multiple)
    $('table[data-gantt-id]').each(function(){
        $.ganttdata[$(this).attr('data-gantt-id')] = outline
    })

    //Process the projects tables
    $('table[data-gantt-role="projects"]').each(function (){
        var id = $(this).attr('data-gantt-id')

        $('tbody tr',this).each(function(){
            var data = $('td',this)
            $.ganttdata[id].projects[$(data[0]).text()] = {
                color:    $(data[1]).text(),
                customer: $(data[2]).text(),
                estimate: $(data[3]).text(),
                deadline: $(data[4]).text()
            }
            $('td:first-child',this).click(selectProject)
        })
    })

    //Process the actual gantt tables
    $('table[data-gantt-role="gantt"]').each(function(){
        var id = $(this).attr('data-gantt-id')
        
        //parse the resources
        $('th',$('thead tr',this)[0]).slice(1).each(function(){
            $.ganttdata[id].resources.push($(this).text())
        })
        
        //parse the timeslots
        $('tbody tr td:first-child',this).each(function(){
            $.ganttdata[id].timeslots.push($(this).text())
        })
        
        //Parse the current assignments
        $('tbody tr',this).each(function(){
            var timeslot = $('td:first-child',this).text()
            var tds = $('td',this).splice(1)

            for(var i=0;i<tds.length;i++){
                var resource = $.ganttdata[id].resources[i]
                var project = $(tds[i]).text()

                if($.ganttdata[id].assignments[timeslot]==undefined){
                    $.ganttdata[id].assignments[timeslot]={}
                }
                
                if($.ganttdata[id].projects[project]!=undefined){
                    $(tds[i]).css('background-color',$.ganttdata[id].projects[project].color)
                }

                $.ganttdata[id].assignments[timeslot][resource]=project
                $(tds[i]).click({timeslot,resource},toggleAssignment)
            }
        })
    })

    function selectProject(){
        $.ganttdata.tmp.selectedproject = $(this).text()
    }

    function toggleAssignment(eventdata){
        var timeslot = eventdata.data.timeslot
        var resource = eventdata.data.resource

        //is a project selected? If not get out of here!
        if($.ganttdata.tmp.selectedproject == undefined){
            return
        }

        var table = $(this).closest('table[data-gantt-id]')
        var id = table.attr('data-gantt-id')
        
        var currentProject = $.ganttdata[id].assignments[timeslot][resource]
        var selectedProject = $.ganttdata.tmp.selectedproject
  
        if(currentProject == selectedProject){
            $(this).text('')
            $(this).css('background-color','')
            $.ganttdata[id].assignments[timeslot][resource] = '';
        }
        else{
            $(this).text(selectedProject)
            $(this).css('background-color', $.ganttdata[id].projects[selectedProject].color)
            $.ganttdata[id].assignments[timeslot][resource] = selectedProject;
        }
    }
}
$(function() {
    $.gantt()
})